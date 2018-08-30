var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');


gulp.task('sass', function () {
  return gulp.src('./sass/*.scss')
    .pipe(autoprefixer({
             browsers: ['last 99 versions'],
             cascade: false
         }))
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./css'));
});

// Static Server + watching scss/html files
gulp.task('serve', function(){

    browserSync.init({
         proxy: "http://mypor.ru"
    });

    gulp.watch('./sass/*.scss', ['sass']);
    
    gulp.watch(["js/*.js",'/sass/*.scss','/*.html','*/*.js']).on('change', browserSync.reload);
});