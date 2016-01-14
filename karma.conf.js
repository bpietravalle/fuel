'use strict';

var path = require('path');
var conf = require('./gulp/conf');

var _ = require('lodash');
var wiredep = require('wiredep');

var pathSrcHtml = [
    path.join(conf.paths.src, '/**/*.html')
];

function listFiles() {
    var wiredepOptions = _.extend({}, conf.wiredep, {
        dependencies: true,
        devDependencies: true
    });

    var patterns = wiredep(wiredepOptions).js
        .concat([
            path.join(conf.paths.src, '/app/**/*.module.js'),
            path.join(conf.paths.src, '/app/**/**/*.js'),
            path.join(conf.paths.src, '/testutils/*.js'),
            path.join(conf.paths.src, '/**/*.spec.js'),
            path.join(conf.paths.src, '/**/*.html')
        ])
        .concat(pathSrcHtml);

    var files = patterns.map(function(pattern) {
        return {
            pattern: pattern
        };
    });
    files.push({
        pattern: path.join(conf.paths.src, '/assets/**/*'),
        included: false,
        served: true,
        watched: false
    });
    return files;
}

module.exports = function(config) {

    var configuration = {
        files: listFiles(),

        browsers: ['PhantomJS'],

        colors: true,
        singleRun: true,
        autoWatch: false,


        ngHtml2JsPreprocessor: {
            stripPrefix: conf.paths.src + '/',
            moduleName: 'firebase.fuel'
        },
        frameworks: ['jasmine', 'jasmine-matchers', 'angular-filesort'],

        logLevel: 'info',
        angularFilesort: {
            whitelist: [path.join(conf.paths.src, '/**/!(*.html|*.spec|*.mock).js')]
        },


        plugins: [
            'karma-phantomjs-launcher',
            'karma-angular-filesort',
            'karma-coverage',
            'karma-spec-reporter',
            // 'karma-verbose-reporter',
            'karma-nested-reporter',
            'karma-notify-reporter',
            'karma-jasmine-matchers',
            'karma-jasmine',
            'karma-ng-html2js-preprocessor'
        ],
        specReporter: {
            maxLogLines: 5
        },
        coverageReporter: {
            dir: 'coverage',
            reporters: [{
                type: 'html',
                subdir: 'html-report'
            }, {
                type: 'lcov',
                subdir: 'lcov-report'
            }]
        },

        proxies: {
            '/assets/': path.join('/base/', conf.paths.src, '/assets/')
        }

    };
    configuration.preprocessors = {};
    pathSrcHtml.forEach(function(path) {
        configuration.preprocessors[path] = ['ng-html2js'];
    });

    // This block is needed to execute Chrome on Travis
    // If you ever plan to use Chrome and Travis, you can keep it
    // If not, you can safely remove it
    // https://github.com/karma-runner/karma/issues/1144#issuecomment-53633076
    if (configuration.browsers[0] === 'Chrome' && process.env.TRAVIS) {
        configuration.customLaunchers = {
            'chrome-travis-ci': {
                base: 'Chrome',
                flags: ['--no-sandbox']
            }
        };
        configuration.browsers = ['chrome-travis-ci'];
    }

    config.set(configuration);
};
