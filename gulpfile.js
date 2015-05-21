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
      .pipe($.fileInclude())
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
      // autoprefix CSS
      .pipe($.autoprefixer({
         browsers: ['last 2 version'],
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
   return gulp.src(['dev/**/*.*', '!dev/**/*.html', '!dev/html{,/**}', '!dev/**/*.scss'], { dot: true })
      // copy all other files to stage
      .pipe(gulp.dest('stage'), callback);
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

// Minify and Combine JS and CSS files and change paths in HTML to new files
gulp.task('compile', function(callback) {
   var assets = $.useref.assets();

   return gulp.src(['stage/**/*.html', '!stage/html{,/**}'])
      .pipe(assets)
      // remove console and debugger statments
      .pipe($.if('*.js', $.stripDebug()))
      // minify Javascript
      .pipe($.if('*.js', $.uglify()))
      // minify CSS
      .pipe($.if('*.css', $.minifyCss()))
      // combine CSS and Javascript into individual files
      .pipe(assets.restore())
      .pipe($.useref())
      // move files to production
      .pipe(gulp.dest('prod'), callback);
});

// All other files
gulp.task('prodExtras', function(callback) {
   return gulp.src(['stage/**/*.*', '!stage/**/*.{html,css,js}', '!stage/html{,/**}', '!stage/scripts/vendor{,/**}'], { dot: true })
      // copy all other files to 'production'
      .pipe(gulp.dest('prod'));
});

// Notify when build is complete
gulp.task('notify:buildComplete', function(callback) {
   $.notify().write("Build Complete");
   callback();
});

// Watch Tasks
/*-------------------------------------------------------------------------------------------------*/
// Empty the 'stage' directory, then watch for file changes
gulp.task('watch', function(callback) {
    $.runSequence(
      'clean:stage',
      ['htmlInclude', 'styles', 'images', 'scripts', 'stageExtras'],
      'watchDev',
      'notify:watchingDev',
      callback
   );
});

// Watch for file changes
gulp.task('watchDev', function(callback) {
   // the files to watch followed by the function to run when they change
   
   $.watch('dev/**/*.html', function() {
        gulp.start('htmlInclude');
    });
   $.watch('dev/styles/**/*.scss', function() {
        gulp.start('styles');
    });
   $.watch('dev/styles/img/*.*', function() {
        gulp.start('images');
    });
   $.watch('dev/scripts/**/*.js', function() {
        gulp.start('scripts');
    });
   
   callback();
});

// Notify when watching dev
gulp.task('notify:watchingDev', function(callback) {
   $.notify().write("Watching Dev");
   callback();
});