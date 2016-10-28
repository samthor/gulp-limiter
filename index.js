/*
 * Copyright 2016 Sam Thorogood. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

const duplexify = require('duplexify');
const through2 = require('through2');

module.exports = function(tasks) {
  if (tasks === undefined || tasks <= 0) {
    const os = require('os');
    tasks = os.cpus().length - (tasks || 0);
  } else if (tasks < 1 || !isFinite(tasks)) {
    tasks = 1;
  }

  let running = 0;
  const pending = [];

  /**
   * Called when a task is complete: can we invoke more tasks?
   */
  function release() {
    const next = pending.shift();
    if (next) {
      next(release);
    } else {
      --running;
    }
  }

  /**
   * Queue an upcoming task, or run it immediately.
   */
  function queue(runner) {
    if (running < tasks) {
      ++running;
      runner(release);
    } else {
      pending.push(runner);
    }
  }

  /**
   * When called, returns a stream that pipes its contents to the wrapped strream when there's a
   * task available.
   *
   * @param {!stream.Stream} wrapped
   */
  return function(wrapped, opt_name) {
    const inStream = through2.obj();
    const outStream = through2.obj();
    const chunks = [];

    function invoke(done) {
      chunks.forEach(chunk => wrapped.write(chunk));
      wrapped.on('end', () => {
        outStream.end();
        done();
      });
      wrapped.end();  // after on('end', ...) so it gets triggered for zero work
      wrapped.pipe(outStream);
    }

    inStream.on('data', chunk => chunks.push(chunk));
    inStream.on('end', () => queue(invoke));

    return duplexify.obj(inStream, outStream);
  }
};