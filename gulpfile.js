'use strict';

var gulp = require('gulp');
var rename = require('gulp-rename');
var wrap = require('gulp-wrap');
var cssmin = require('gulp-cssmin');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var jade = require('gulp-jade');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');
var transport = require('gulp-cmd-transport');
var concat = require('gulp-concat');
var format = require('date-format');
var pkg = require('./package.json');

gulp.task('css', function() {
  return gulp.src('sass/**/style.scss')
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(cssmin())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('css/'));
});

gulp.task('tpl', function() {
  return gulp.src('template/*.jade')
    .pipe(plumber())
    .pipe(jade({
      client: true
    }))
    .pipe(wrap('define(function (require, exports, module) {var jade = require("jade");return <%= contents %>});'))
    .pipe(gulp.dest('js/template/'));
});

gulp.task('uglify', ['tpl'], function(cb) {
  return gulp.src(['*(js)/**/*', '!js/sea.js'])
    .pipe(plumber())
    .pipe(uglify({
      mangle: {
        except: ['require', 'exports', 'module']
      }
    }))
    .pipe(gulp.dest('dest'));
});

gulp.task('copy', ['css'], function(cb) {
  return gulp.src(['*(css|img|views)/**/*', '*(js)/sea.js'])
    .pipe(gulp.dest('dest'));
})

gulp.task('build', ['uglify', 'copy'], function() {
  return gulp.src(['dest/**/*'])
    .pipe(zip(pkg.name + '-' + format.asString('yyyy-MM-dd_hh-mm-ss', new Date()) + '.zip'))
    .pipe(gulp.dest(''));
});

gulp.task('watch', ['default'], function() {
  gulp.watch(['sass/**/*.scss'], ['css']);
  gulp.watch(['template/*.jade'], ['tpl']);
});

gulp.task('default', ['css', 'tpl']);