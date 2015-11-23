/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are splitted in several files in the gulp directory
 *  because putting all here was really too long
 */

'use strict';
var gulp = require('gulp');
var wrench = require('wrench');
var concat = require('gulp-concat');

/**
 *  This will load all js or coffee files in the gulp directory
 *  in order to load all gulp tasks
 */
wrench.readdirSyncRecursive('./gulp').filter(function(file) {
    return (/\.(js|coffee)$/i).test(file);
}).map(function(file) {
    require('./gulp/' + file);
});

gulp.task('concat', function() {
    return gulp.src(["./src/app/fuel.js", "./src/app/firePath.js", "./src/app/utils.js"])
        .pipe(concat("fuelProvider.js"))
        .pipe(gulp.dest("./dist/"));
});
/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
gulp.task('default', ['clean'], function() {
    gulp.start('build');
});
