'use strict';

var gulp = require('gulp'),
  sass = require('gulp-sass'),
  livereload = require('gulp-livereload'),
  cleanhtml = require("gulp-cleanhtml"),
  inline = require('gulp-inline'),
  uglify = require('gulp-uglify'),
  minifyCss = require('gulp-minify-css');

gulp.task('default', function () {
  gulp.start('build');
});

gulp.task('styles', function () {
  gulp.src(['app/sass/**/*.scss'])
    .pipe(sass({
      style: 'expanded'
    }))
    .pipe(gulp.dest('app/css'));
});

gulp.task('pages', function () {
  return gulp.src('app/*.html')
    .pipe(cleanhtml())
    .pipe(inline({
      base: 'public/',
      js: uglify,
      css: minifyCss,
      disabledTypes: ['img'],//disable img inlining due to some bug in module that does not handle a broken img tag which Im assuming you have in the html and Im too lazy to hunt down :)
      ignore: []
    }))
    .pipe(gulp.dest('dist/'));
});


gulp.task('build', ['styles', 'pages']);

gulp.task('server', function () {
  var connect = require('connect'),
    server = connect();
  server.use(connect.static('dist')).listen(process.env.PORT || 9122);
  require('opn')('http://localhost:' + (process.env.PORT || 9122));
});

gulp.task('watch', ['server'], function () {
  gulp.start('build');

  gulp.watch('app/sass/**/*.scss', ['styles']);

  gulp.watch('app/*.html', ['pages']);

  var server = livereload();
  gulp.watch('dist/**').on('change', function (file) {
    server.changed(file.path);
  });
});
