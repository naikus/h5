var gulp = require("gulp"),
      jshint = require("gulp-jshint"),
      clean = require("gulp-clean"),
      concat = require("gulp-concat"),
      uglify = require("gulp-uglify");


/** 
 * Global level build configuration
 */
var config = {
   modules: [
      "LICENSE",
      "src/h5.js",
      "src/event.js",
      "src/dom.js",
      "src/touch.js",
      "src/xhr.js"
   ],
   
   modules_legacy: [
      "src/event_ie.js"
   ],
   
   dist_dir: "dist/"
};



/**
 * The default task
 */
gulp.task("default", function() {
   console.log("Available tasks:");
   console.log([
      "------------------------------------------------------------------------",
      "jshint        Run jshint on all the source files",
      "build         Build webapp in the dest directory",
      "clean         Clean the dest directory",
      "-------------------------------------------------------------------------"
   ].join("\n"));
});


/**
 * Cleanup the dist directory
 */
gulp.task("clean", function() {
   return gulp.src(config.dist_dir, {read: false})
         .pipe(clean({force: true}));
});


/**
 * Setup jshint for all app files
 */
gulp.task("jshint", function() {
   return gulp.src("src/**/*.js")
         .pipe(jshint({eqnull: true}))
         .pipe(jshint.reporter("default"));
});

/**
 * Our main task to build webapp. Here we ensure that clean task runs before
 * others
 */
gulp.task("build", ["clean"], function() {
   // do other build things
   gulp.start("jshint");      
 
   gulp.src(config.modules)
         .pipe(concat("h5.js"))
         .pipe(gulp.dest(config.dist_dir));
 
   gulp.src(config.modules)
         .pipe(concat("h5.min.js"))
         .pipe(gulp.dest(config.dist_dir))
         .pipe(uglify())
         .pipe(jshint({eqnull: true, comments: /^\/\*\!*/}))
         .pipe(gulp.dest(config.dist_dir));
});
