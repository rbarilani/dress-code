/**
 *
 *
 *
 *  DEMO/DEVELOPMENT TASKS
 *
 *
 *
 */

var gulp = require('gulp');
var path = require('path');
var rimraf = require('rimraf');
var assemble = require('fabricator-assemble');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var gutil = require('gulp-util');
var webpack = require('gulp-webpack');
var rename = require('gulp-rename');
var autoprefixer = require('gulp-autoprefixer');
var imagemin = require('gulp-imagemin');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var ghPages = require('gulp-gh-pages');
var helper = require('./util/helper');
var debug = require('gulp-debug');


gulp.task('demo:build', function (done) {
    runSequence('demo:clean', 'demo:icon-font', ['demo:images', 'demo:styles', 'demo:scripts', 'demo:assemble'], done)
});

// clean
gulp.task('demo:clean', function (cb) {
    rimraf('.tmp/demo', cb);
});

// styles
gulp.task('demo:styles', function () {
    gulp.src(path.join('docs/demo', '/assets/styles/*.scss'))
        .pipe(sourcemaps.init())
        .pipe(helper.sass())
        .pipe(autoprefixer('last 2 version'))
        .pipe(rename('main.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.join('.tmp/demo', '/assets/styles')))
        .pipe(reload({stream: true}));
});


//// scripts
gulp.task('demo:scripts', function () {
    var demoWebpackConfig = require('../webpack.demo.config')(gutil.env['mode']);
    return gulp
        .src(demoWebpackConfig.entry['scripts/main'])
        .pipe(webpack(demoWebpackConfig))
        .pipe(gulp.dest(path.join('.tmp/demo', '/assets')));
});


// images
gulp.task('demo:images', ['demo:favicon'], function () {
    return gulp.src(path.join('docs/demo', '/assets/img/*'))
        .pipe(gulp.dest(path.join('.tmp/demo', '/assets/img')));
});

// favicon
gulp.task('demo:favicon', function () {
    return gulp.src(path.join('docs/demo', 'favicon.ico'))
        .pipe(gulp.dest('.tmp/demo'));
});


// assemble, take care of static website generation
gulp.task('demo:assemble', function (done) {
    var basePath = gutil.env['demo-base-path'] ? gutil.env['demo-base-path'] : '';

    assemble({
        layouts: 'docs/demo/views/layouts/*',
        layoutIncludes: 'docs/demo/views/layouts/includes/*',
        views: ['docs/demo/views/**/*', '!docs/demo/views/+(layouts)/**'],
        materials: 'docs/demo/materials/**/*',
        data: 'docs/demo/data/**/*.{json,yml}',
        docs: ['docs/**/*.md'],
        logErrors: true,
        dest: '.tmp/demo',
        helpers: {
            basePath: function () {
                return basePath;
            }
        }
    });
    done();
});


// server
gulp.task('demo:serve', ['demo:build'], function () {

    browserSync({
        // process env variable PORT or command line argument --PORT or default 3000
        port: process.env.PORT || gutil.env['PORT'] || 3000,
        server: {
            baseDir: '.tmp/demo'
        },
        notify: false,
        logPrefix: 'FABRICATOR',
        open: gutil.env.open || false
    });

    gulp.task('demo:assemble:watch', ['demo:assemble'], reload);
    gulp.watch('docs/{demo,guides}/**/*.{html,md,json,yml}', ['demo:assemble:watch']);

    gulp.watch('docs/demo/assets/styles/**/*.scss', ['demo:styles']);
    gulp.watch('src/styles/**/*.scss', ['lint', 'demo:styles']);

    gulp.task('demo:scripts:watch', ['demo:scripts'], reload);
    gulp.watch('docs/demo/assets/scripts/**/*.js', ['demo:scripts:watch']);

    gulp.task('demo:images:watch', ['demo:images'], reload);
    gulp.watch('docs/demo/assets/img', ['demo:images:watch']);

    gulp.task('icons:watch', reload);
    gulp.watch('src/icons/**/*.svg', ['icons:watch']);

    gulp.task('demo:svg-icons:watch', ['demo:svg-icons'], reload);
    gulp.watch('./src/img/svg-icons/**/*.svg', ['demo:svg-icons:watch']);

});


// Generate the font by using what is found in the src/icons folder
// Generate the scss _generated/icons.scss to use icons as classes
gulp.task('demo:icon-font', ['icons', 'demo:svg-icons'], function () {
    return gulp.src('./.tmp/iconfont/fonts/**/*')
        .pipe(gulp.dest(path.join('.tmp/demo', '/assets/fonts')))
});

gulp.task('demo:svg-icons',  function () {
    return gulp.src('./src/img/svg-icons/**/*.svg')
        .pipe(gulp.dest(path.join('.tmp/demo', '/assets/img/svg-icons')))
});

gulp.task('demo:deploy', ['demo:build'], function () {
    return gulp.src(path.join('.tmp/demo', '/**/*'))
        .pipe(debug())
        .pipe(ghPages({
            push: gutil.env['dry-run'] ? false : true,
            cacheDir: '.tmp/deploy-demo',
            remoteUrl: 'git@github.com:zalando/dress-code.git'
        }));
});
