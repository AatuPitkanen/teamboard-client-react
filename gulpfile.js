'use strict';

var fs   = require('fs');
var url  = require('url');
var path = require('path');
var args = require('minimist')(process.argv);
var http = require('http');

var gulp       = require('gulp');
var sass       = require('gulp-sass');
var karma      = require('gulp-karma');
var eslint     = require('gulp-eslint');
var uglify     = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

var scp    = require('gulp-scp2');
var sync   = require('browser-sync');
var server = require('gulp-webserver');

var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

var envify     = require('envify');
var babelify   = require('babelify');
var watchify   = require('watchify');
var browserify = require('browserify');

// The test runner mode can be configured to be either single run (default), or
// to watch the files for changes and rerun tests.
var mode = args['test-runner-mode'] === 'watch' ? 'watch' : 'run';

// We need to setup browserify. For regular builds we use 'browserify' by
// itself, but for builds that keep repeating, we use 'watchify'. Note that we
// set the 'debug' flag in order to preserve sourcemaps.
watchify.args           = watchify.args || { }
watchify.args.debug     = process.env.NODE_ENV !== 'production';
watchify.args.fullPaths = process.env.NODE_ENV !== 'production';

var entry   = path.join(__dirname, 'src/scripts/app.js');
var bundler = browserify(entry, watchify.args);

if(args['use-watchify']) {
	bundler = watchify(bundler);
}
bundler = bundler.transform(envify).transform(babelify);

/**
 * Bundles the code using bundler.
 *
 * NOTE If this task is ran in 'production' environment, the sourcemaps are not
 *      present and the code will be minified in order to ensure the smallest
 *      possible size of the generated bundle.
 */
function bundle() {
	var stream = bundler.bundle().pipe(source('app.js'));

	if(process.env.NODE_ENV === 'production') {
		stream = stream.pipe(buffer()).pipe(uglify());
	}
	else {
		stream = stream.pipe(buffer())
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(sourcemaps.write());
	}

	stream = stream.pipe(gulp.dest('dist'));

	if(args['use-browser-sync']) {
		stream = stream.pipe(sync.reload({ stream: true, once: true }));
	}
	return stream;
}

/**
 * Creates the BrowserSync server used to serve static content.
 */
function createSyncServer() {
	/**
	 * Middleware for serving the 'index.html' file.
	 * Based on https://github.com/BrowserSync/browser-sync/issues/204#issuecomment-51469022
	 */
	function serveDefault(req, res, next) {
		var file = url.parse(req.url);
		    file = file.href.split(file.search).join('');

		var exists = fs.existsSync(path.join(__dirname, file));

		if(!exists && file.indexOf('browser-sync-client') < 0) {
			req.url = '/index.html';
		}
		return next();
	}
	return sync({ server: { baseDir: '.', middleware: serveDefault } });
}

/**
 * Creates a Karma test runner with the given 'mode'.
 */
function createTestRunner(mode) {
	return function() {
		return gulp.src('test/**/*.js')

			// Possible modes are 'run' and 'watch'.
			.pipe(karma({ action: mode, configFile: 'karma.conf.js' }))

			// Any errors should be thrown as to not silence them...
			.on('error', function(err) { throw err; });
	}
}

/**
 * Unit tests.
 */
gulp.task('test', createTestRunner(mode));

/**
 * Lint the source code.
 */
gulp.task('lint', function() {
	return gulp.src('src/scripts/**/*.js')
		.pipe(eslint())
		.pipe(eslint.format());
});

/**
 * Build the JavaScript source files.
 */
gulp.task('build-js', bundle);

/**
 * Build the CSS source.
 */
gulp.task('build-css', function() {
	return gulp.src('src/styles/app.sass')
		.pipe(sass({
			indentedSyntax:  true,
			errLogToConsole: true,
		}))
		.pipe(gulp.dest('dist'));
});

/**
 * Build the various assets, such as images, etc...
 */
gulp.task('build-assets', function() {
	return gulp.src('./src/assets/**/*')
		.pipe(gulp.dest('./dist/assets/'));
});

/**
 * Build everything!
 */
gulp.task('build', ['build-assets', 'build-css', 'build-js']);

/**
 * Serve the static content and run a livereload server. If the script is given
 * a '--use-browser-sync' argument, the content is served through BrowserSync,
 * and so no livereload is not needed.
 */
gulp.task('serve', ['build'], function() {
	if(args['use-browser-sync']) return createSyncServer();

	return gulp.src('.').pipe(server({
		port:       process.env.PORT      || 8000,
		host:       process.env.HOSTNAME  || '0.0.0.0',
		fallback:   'index.html',
		livereload: true
	}));
});

/**
 * Build the application, move it with scp.
 * Takes SSH host, username, password and folder to move the app as parameters
 *
 * For example:  SCP_HOST=localhost SCP_USER=moi SCP_PW=kaikki SCP_DEST=/home/ gulp scp
 * Remember to set API and IO env variables to point to right machine!
 *
 * IO_URL=http://192.168.142.21:9001 API_URL=http://192.168.142.21:9002/api [.. other stuff ..] gulp scp
 */
gulp.task('scp', ['build'], function() {
	if(!process.env.IO_URL)  console.warn('WARNING: IO_URL environment variable not set!');
	if(!process.env.API_URL) console.warn('WARNING: API_URL environment variable not set!');

	var host     = process.env.SCP_HOST || 'localhost';
	var username = process.env.SCP_USER || 'cf2015';
	var password = process.env.SCP_PW   || '';
	var dest     = process.env.SCP_DEST || '/home/cf2015/scp';

	var files = [
		'index.html',
		'./dist/app.js',
		'./dist/app.css',
		'./dist/assets/img/logo.svg',
		'./dist/assets/img/bg/*.png'
	];

	return gulp.src(files, { base: '.' })
		.pipe(scp({
			host: host,
			username: username,
			password: password,
			dest: dest
		}))
		.on('error', function(err) {
			console.log(err);
		});
});

/**
 * Build the client, move it with scp, broadcast message to Matti.
 * Remember to set the MATTI_PORT and MATTI_ADDR environment variables,
 * along with the same variables you use with the regular SCP task.
 */
gulp.task('matti', ['scp'], function() {
	var msg = 'BrowserSync in use by user ';

	if(process.env.USER) {
		msg += process.env.USER;
	} else {
		msg += 'unknown user';
	}
	sendMessageToMatti(msg, 'en');
});

/**
 * Keep track of the source files and rebuild as necessary.
 */
gulp.task('default', ['serve'], function() {
	gulp.watch('./src/assets/**/*',      [ 'build-assets' ]);
	gulp.watch('./src/styles/**/*.sass', [ 'build-css' ]);

	if(args['use-watchify']) {
		bundler.on('update', bundle);
	}
	else gulp.watch('./src/scripts/**/*.js', [ 'build-js' ]);
});


/**
 * Send message to Matti TTS server.
 * process.exit(0) hack because gulp doesn't like
 * asynchronous stuff.
 */
function sendMessageToMatti(content, language) {
	var port    = process.env.MATTI_PORT || 1234;
	var address = process.env.MATTI_ADDR || '0.0.0.0';

	var content = JSON.stringify({ 
			 message:  content,
			 language: language
	});

	var headers = {
			'Content-Type'  : 'application/json',
			'Content-length': content.length
	}

	var options = {
			host:    address,
			port:    port,
			method: 'POST',
			headers: headers
	}

	var req = http.request(options, function(res) {
		process.exit(0);
	});
	req.write(content);
	req.end();
}
