Limits something from running more than N times in parallel.
Available as `gulp-limiter`.

Usage-

```js
const limiter = require('gulp-limiter');

// later
gulp.task('foo', function() {
  const limit = limiter(5);

  // nb. you should be merging these streams before return too
  manyTasks.forEach(function() {
    gulp.src(files)
      .pipe(limit(complexTask()))   // this line!
      .pipe(gulp.dest('./dest'));
  });
});
```

Limiter accepts a maximum number of tasks to run in parallel, but always uses a minimum of one.
If unspecified, uses the number of CPUs in your machine.
If negative, uses the number of CPUs minus that number.
