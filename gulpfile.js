/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are splitted in several files in the gulp directory
 *  because putting all here was really too long
 */

'use strict';
var gulp = require('gulp');
var wrench = require('wrench');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');

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
    return gulp.src(["./src/app/**/*.module.js", "./src/app/**/*.js",
            "!./src/app/**/*.spec.js"
        ])
        .pipe(concat("fuelProvider.js"))
        .pipe(ngAnnotate())
        .pipe(gulp.dest("./dist/scripts/"));
});
/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
gulp.task('default', ['clean'], function() {
    gulp.start('build');
});
