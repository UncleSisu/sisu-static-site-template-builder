'use strict';
var gulp = require('gulp');

// load plugins from package.json file
var $ = require('gulp-load-plugins')();
    $.del = require('del');
    $.runSequence = require('run-sequence');

// Stage Tasks
/*-------------------------------------------------------------------------------------------------*/
// Compile files for 'stage'
// Empty the 'stage' directory, then watch for file changes
gulp.task('stage', function(callback) {
   $.runSequence(
      'clean:stage',
      ['htmlInclude', 'styles', 'images', 'scripts', 'stageExtras'],
      callback
   );
});

// Empty 'stage' directory so we can start fresh
gulp.task('clean:stage', function(callback) {
   $.del([
      'stage/**/*',
      // leave the index so live-reload still works
      '!stage/index.html'
  ], callback);
});

// Combine HTML partials
gulp.task('htmlInclude', function(callback) {
   return gulp.src(['dev/**/*.html', '!dev/html{,/**}'])
      // compile HTML includes
      .pipe($.fileInclude({
         basepath: 'dev/',
         indent: true
      }))
      // prettify the html since the include messes up the indentation
      .pipe($.prettydiff({
         lang: "html",
         mode: "beautify",
         insize: 3,
         wrap: 0
      }))
      // Catch any errors and prevent them from crashing gulp
      .on('error', function (error) {
         $.notify().write(error);
         this.emit('end');
      })
      // move files to stage
      .pipe(gulp.dest('stage'), callback);
});

// SASS
gulp.task('styles', function(callback) {
   return gulp.src('dev/styles/**/*.scss')
      // Load existing internal sourcemap
      .pipe($.sourcemaps.init())
      // generate CSS from SASS
      .pipe($.sass())
      // Catch any errors and prevent them from crashing gulp
      .on('error', function (error) {
         $.notify().write(error);
         this.emit('end');
      })
      // autoprefix CSS using bootstrap standards
      .pipe($.autoprefixer({
         browsers: [
            "Android 2.3",
            "Android >= 4",
            "Chrome >= 20",
            "Firefox >= 24",
            "Explorer >= 8",
            "iOS >= 6",
            "Opera >= 12",
            "Safari >= 6"
         ],
         remove: false
      }))
      // Write final .map file
      .pipe($.sourcemaps.write())
      // move files to stage
      .pipe(gulp.dest('stage/styles'), callback);
});

// Images used by CSS
gulp.task('images', function(callback) {
   return gulp.src('dev/styles/img/*.*')
      // copy images to stage
      .pipe(gulp.dest('stage/styles/img'), callback);
});

// Javascript
gulp.task('scripts', function(callback) {
   return gulp.src('dev/scripts/**/*.js')
      // copy scripts to stage
      .pipe(gulp.dest('stage/scripts'), callback);
});

// All other files
gulp.task('stageExtras', function(callback) {
   return gulp.src(['dev/**/*.*', 'dev/**', '!dev/**/*.html', '!dev/html{,/**}', '!dev/**/*.scss'], { dot: true })
      // copy all other files to stage
      .pipe(gulp.dest('stage'), callback);
});

// Watch Tasks
/*-------------------------------------------------------------------------------------------------*/
// Empty the 'stage' directory, then watch for file changes
gulp.task('watch', function(callback) {
    $.runSequence(
      'stage',
      'watchDev',
      'notify:watchingDev',
      callback
   );
});

// Watch for file changes
gulp.task('watchDev', function(callback) {
   // the files to watch followed by the function to run when they change
   // HTML
   $.watch('dev/**/*.html', function() {
        gulp.start('htmlInclude');
    });
   // SASS
   $.watch('dev/styles/**/*.scss', function() {
        gulp.start('styles');
    });
   // Images
   $.watch('dev/styles/img/*.*', function() {
        gulp.start('images');
    });
   // Scripts
   $.watch('dev/scripts/**/*.js', function() {
        gulp.start('scripts');
    });
   // Everything else
   $.watch(['dev/**/*.*', 'dev/**', '!dev/**/*.html', '!dev/html{,/**}', '!dev/**/*.scss'], function() {
        gulp.start('stageExtras');
    });
   
   callback();
});

// Notify when watching dev
gulp.task('notify:watchingDev', function(callback) {
   $.notify().write("Watching Dev");
   callback();
});

// Production Tasks
/*-------------------------------------------------------------------------------------------------*/
// Make 'build' the default task
gulp.task('default', function() {
   gulp.start('build');
});

// Build production
gulp.task('build', function(callback) {
   $.runSequence(
      ['clean:prod','clean:stage'],
      ['htmlInclude', 'styles', 'scripts', 'stageExtras'],
      'compile',
      ['minifyJS','minifyCSS'],
      'prodExtras',
      'notify:buildComplete',
      callback
   );
});

// Empty 'prod' directory so we can start clean
gulp.task('clean:prod', function(callback) {
   $.del([
      'prod/**/*'
  ], callback);
});

// Combine JS and CSS files and change paths in HTML to new files
gulp.task('compile', function(callback) {
   return gulp.src(['stage/**/*.html', '!stage/html{,/**}'])
      // use production mode
      .pipe($.preprocess({context: {PRODUCTION: true}}))
      // get userref assets
      .pipe($.useref())
      // move files to production
      .pipe(gulp.dest('prod'), callback);
});

// Minify JS
gulp.task('minifyJS', function(callback) {
   return gulp.src(['prod/**/*.js'])
      // remove console and debugger statments
      .pipe($.stripDebug())
      // minify Javascript
      .pipe($.uglify())
      // move files to production
      .pipe(gulp.dest('prod'), callback);
});

gulp.task('minifyCSS', function(callback) {
   return gulp.src(['prod/**/*.css'])
      // minify CSS
      .pipe($.cleanCss({
         processImport: false
      }))
      // move files to production
      .pipe(gulp.dest('prod'), callback);
});

// All other files
gulp.task('prodExtras', function(callback) {
   return gulp.src(['stage/**/*.*', 'stage/**', '!stage/**/*.{html,css,js}', '!stage/html{,/**}', '!stage/styles{,/**}', '!stage/scripts{,/**}'], { dot: true })
      // copy all other files to 'production'
      .pipe(gulp.dest('prod'));
});

// Notify when build is complete
gulp.task('notify:buildComplete', function(callback) {
   $.notify().write("Build Complete");
   callback();
});
