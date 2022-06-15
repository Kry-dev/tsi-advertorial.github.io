"use strict";

var gulp = require('gulp'),
  sass = require('gulp-sass')(require('sass')),
  del = require('del'),
  uglify = require('gulp-uglify'),
  cleanCSS = require('gulp-clean-css'),
  rename = require("gulp-rename"),
  merge = require('merge-stream'),
  htmlreplace = require('gulp-html-replace'),
  autoprefixer = require('gulp-autoprefixer'),
  browserSync = require('browser-sync').create(),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  // webp = require('imagemin-webp'),
  webp = require('gulp-webp'),
  svgSprite = require('gulp-svg-sprite');


// Clean task
gulp.task('clean', function () {
    return del(['dist', 'assets/css/app.css']);
});

// Copy third party libraries from node_modules into /vendor
gulp.task('vendor:js', function () {
    return gulp.src([
        './node_modules/bootstrap/dist/js/*',
        './node_modules/@popperjs/core/dist/umd/popper.*'
    ])
      .pipe(gulp.dest('./assets/js/vendor'));
});

// Copy bootstrap-icons from node_modules into /fonts
gulp.task('vendor:fonts', function () {
    return gulp.src([
        './node_modules/bootstrap-icons/**/*',
        '!./node_modules/bootstrap-icons/package.json',
        '!./node_modules/bootstrap-icons/README.md',
    ])
      .pipe(gulp.dest('./assets/fonts/bootstrap-icons'))
});

// vendor task
gulp.task('vendor', gulp.parallel('vendor:fonts', 'vendor:js'));

// Copy vendor's js to /dist
gulp.task('vendor:build', function () {
    var jsStream = gulp.src([
        './assets/js/vendor/bootstrap.bundle.min.js',
        './assets/js/vendor/popper.min.js'
    ])
      .pipe(gulp.dest('./dist/assets/js/vendor'));
    var fontStream = gulp.src(['./assets/fonts/bootstrap-icons/**/*.*']).pipe(gulp.dest('./dist/assets/fonts/bootstrap-icons'));
    return merge(jsStream, fontStream);
})

// Copy Bootstrap SCSS(SASS) from node_modules to /assets/scss/bootstrap
gulp.task('bootstrap:scss', function () {
    return gulp.src(['./node_modules/bootstrap/scss/**/*'])
      .pipe(gulp.dest('./assets/scss/bootstrap'));
});

// Compile SCSS(SASS) files
gulp.task('scss', gulp.series('bootstrap:scss', function compileScss() {
    return gulp.src(['./assets/scss/*.scss'])
      .pipe(sass.sync({
          outputStyle: 'expanded'
      }).on('error', sass.logError))
      .pipe(autoprefixer())
      .pipe(gulp.dest('./assets/css'))
}));

// Minify CSS
gulp.task('css:minify', gulp.series('scss', function cssMinify() {
    return gulp.src("./assets/css/*.css")
      .pipe(cleanCSS())
      .pipe(rename({
          suffix: '.min'
      }))
      .pipe(gulp.dest('./dist/assets/css'))
      .pipe(browserSync.stream());
}));

// Minify Js
gulp.task('js:minify', function () {
    return gulp.src([
        './assets/js/app.js'
    ])
      .pipe(uglify())
      .pipe(rename({
          suffix: '.min'
      }))
      .pipe(gulp.dest('./dist/assets/js'))
      .pipe(browserSync.stream());
});

// Images Task

gulp.task('images', function () {
    return gulp.src('assets/img/photos/*{gif,png,jpg}')
      .pipe(imagemin([

          imagemin.gifsicle({interlaced: true}),
          imagemin.mozjpeg({quality: 75, progressive: true}),
          pngquant([{
              quality: '70-90', // When used more then 70 the image wasn't saved
              speed: 1, // The lowest speed of optimization with the highest quality
              floyd: 1 // Controls level of dithering (0 = none, 1 = full).
          }]),

          // imagemin.optipng({optimizationLevel: 5}),

      ]))
      .pipe(gulp.dest('./dist/assets/img/photos'))
});

gulp.task('webp', function () {
    return gulp.src('assets/img/photos/*{gif,png,jpg}')
      .pipe(webp({
          quality: '60'
      }))
      .pipe(gulp.dest('assets/img/photos/'))
      .pipe(gulp.dest('./dist/assets/img/photos'))
});

//SVG Sprite
gulp.task('svgSprite', function () {
    return gulp.src('assets/img/svg/*.svg') // svg files for sprite
      .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "../sprite.svg"  //sprite file name
                }
            },
        }
      ))
      .pipe(gulp.dest('assets/img/'));
});

// Replace HTML block for Js and Css file to min version upon build and copy to /dist
gulp.task('replaceHtmlBlock', function () {
    return gulp.src(['*.html'])
      .pipe(htmlreplace({
          'js': 'assets/js/app.min.js',
          'css': 'assets/css/app.min.css'
      }))
      .pipe(gulp.dest('dist/'));
});

// Configure the browserSync task and watch file path for change
gulp.task('dev', function browserDev(done) {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
    gulp.watch(['assets/scss/*.scss', 'assets/scss/**/*.scss', '!assets/scss/bootstrap/**'], gulp.series('css:minify', function cssBrowserReload(done) {
        browserSync.reload();
        done(); //Async callback for completion.
    }));
    gulp.watch('assets/js/app.js', gulp.series('js:minify', function jsBrowserReload(done) {
        browserSync.reload();
        done();
    }));
    gulp.watch(['*.html']).on('change', browserSync.reload);
    done();
});

// Build task
gulp.task("build", gulp.series(gulp.parallel('css:minify', 'js:minify', 'vendor'), 'vendor:build', function copyAssets() {
    return gulp.src([
        '*.html',
        "assets/img/**"
    ], {base: './'})
      .pipe(gulp.dest('dist'));
}));

// Default task
gulp.task("default", gulp.series("clean", 'build', 'replaceHtmlBlock', 'images', 'webp'));
