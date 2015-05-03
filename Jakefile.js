////////////////////////////////////////////////////////////////////////////////
// JAKEFILE ////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/* global jake: false, desc: false, task: false, file: false, directory: false,
   namespace: false */
/* jshint strict: false */

var express    = require('express'),
    livereload = require('livereload'),
    colors     = require('colors/safe'),
    fs         = require('fs');

// Constants
var PORT   = 8080,
    BUILD  = 'build', // Customizable BUILD and PUBLIC directory names
    PUBLIC = 'public';

// Custom functions
jake.npmExec = function (input, opts) {
  opts = opts || { breakOnError: true, printStderr: true, printStdout: true };
  jake.logger.log(colors.grey('$ '+input));
  return this.exec(['PATH=$(npm bin):$PATH '+input], opts);
};

function log (msg) {
  jake.logger.log(colors.green(msg));
}

function replaceAll (input, matchers) {
  var output = input;
  Object.keys(matchers).forEach(function (key) {
    output = output.replace(new RegExp(key, 'g'), matchers[key]);
  });
  return output;
}

function isDev () { return process.env.env !== 'production'; }
function target () { return isDev() ? BUILD : PUBLIC; }

// TASKS ///////////////////////////////////////////////////////////////////////

task('default', ['build:all']);

directory(BUILD);  // Automatically creates BUILD directory when invoked
directory(PUBLIC); // The same, but for PUBLIC

desc('Runs JS through nodelint');
task('hint', function () {
  log('Running jsxhint...');
  jake.npmExec('jsxhint src/script/* src/script/**/* Jakefile.js');
});

desc('Runs tests');
task('test', function () {
  jake.npmExec('jasmine');
});

namespace('build', function () {
  desc('Packages all scripts into bundle.js');
  task('script', [BUILD, 'hint'], function () {
    log('Processing scripts...');
    var debug   = isDev() ? '--debug' : '',
        globs   = ['*', '**/*'],
        dots    = ['js', 'jsx'],
        paths   = [], transforms = [], command;

    globs.forEach(function (g) {
      dots.forEach(function (x) {
        paths.push('src/script/'+g+'.'+x);
      });
    });

    command = 'sources=`SOURCES`; browserify $sources TRANS DEBUG -o OUTPUT';
    transforms = ('reactify debowerify strictify').split(' ');

    jake.npmExec(replaceAll(command, {
      // Possible filepaths -> existing filepaths (so Browserify won't break)
      SOURCES: 'ls '+paths.join(' ')+' 2> /dev/null',
      TRANS: '-t '+transforms.join(' -t '),
      DEBUG: debug,
      OUTPUT: BUILD+'/bundle.js'
    }));
  });

  task('workers', [BUILD, 'hint'], function () {
    log('Processing workers...');
    jake.mkdirP('build/workers');

    var workers = ['simulation'];

    workers.forEach(function (name) {
      name = name+'-worker';
      jake.npmExec('browserify src/script/workers/'+name+'.js '+
                   '-t strictify -o build/workers/'+name+'.js');
    });
  });

  desc('Packages all styles into bundle.css');
  task('style', [BUILD], function () {
    log('Processing styles...');
    jake.npmExec('stylus src/style --out '+BUILD+'/bundle.css');
  });

  [BUILD, PUBLIC].forEach(function (dir) {
    file(dir+'/index.html', ['src/index.html', dir], function () {
      log('Copying index.html...');
      jake.cpR('src/index.html', dir+'/index.html');
    });
  });

  desc('Copies src/index.html to the target');
  task('index', function () {
    jake.Task['build:'+target()+'/index.html'].invoke();
  });

  desc('Performs all build tasks');
  task('all', ['index', 'script', 'workers', 'style'], function () {
    if (isDev()) {
      log(BUILD+'/ is ready!');
      return;
    }

    log('Minifying JS and CSS...');
    ['css', 'js'].forEach(function (ext) {
      var output = PUBLIC+'/bundle.'+ext, input = BUILD+'/bundle.'+ext;
      jake.npmExec('minify --output '+output+' '+input);
    });
    log(PUBLIC+'/ is ready!');
  });
});

desc('Watch src/ and rebuild when something changes');
task('watch', function () {
  log('Watching src/');
  jake.npmExec('watchy -w src/ -- jake');
});

// SERVER //////////////////////////////////////////////////////////////////////

// jake server port=... specifies a custom port
// jake server env=production serves from public/ and disables livereload

desc('Simple web server with livereload and src/ watching');
task('server', ['build:all'], function () {
  // This task implements a simple Express server which serves static files
  // Any unknown paths will display index.html
  //
  // If environment is dev (default), a livereload server will be started
  // and the livereload.js file will be injected before the </head> tag
  // when index.html is being served
  //
  // If changes are noticed in src/, the project will be re-built (dev env only)

  var app = express(),
      port = process.env.port ? parseInt(process.env.port, 10) : PORT,
      dev  = isDev(),
      dir  = __dirname+'/'+(dev ? BUILD : PUBLIC),
      server, lr;

  if (dev) {
    // lr = livereload.createServer();
    // lr.watch(dir);
    // log('Livereload running');
    jake.Task.watch.invoke();
  }

  function showIndex(res, next) {
    // Read index.html and inject livereload stuff into it
    fs.readFile(dir+'/index.html', function (err, data) {
      if (!data) { next(); return; }
      var html = data.toString(), inj;

      if (dev && false) {
        inj = '<script src="http://localhost:35729/livereload.js"></script>';
        html = data.toString().replace(/(<\/head>)/, inj+'$1');
      }

      res.format({'text/html': function () { res.send(html); } });
    });
  }

  app.use(function(req, res, next) {
    if (process.env.verbose) { log(req.method+' '+req.path); }
    if (!req.path.match(/^index\.html|^\/$/)) {
      fs.open(dir+req.path, 'r', function (err) {
        // No error? This is an asset, pass to other routes
        return err ? showIndex(res, next) : next();
      });
    } else {
      showIndex(res, next);
    }
  });

  app.use(express.static(dir));

  server = app.listen(port);
  log('Server running on localhost:'+port);
});
