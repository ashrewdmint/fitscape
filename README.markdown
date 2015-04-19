# Fitscape

## About

Fitscape is a simple genetic algorithm that you can play around with. It will
show you virutal organisms that evolve by mutation and natural selection.

## Project details

This project uses `bower` and `npm` for package management, `stylus` for CSS,
`browserify` for JavaScript modules/dependencies, `jasmin` for tests, `jshint`
for code quality enforcement, and `jake` for building and tasks (instead of
`gulp` or `grunt`).

## Getting started

 1. Install `node` at `https://nodejs.org/download/`. Also consider using `nvm`
    to manage different versions of `node`
 1. `$ npm install`
 1. `$ npm install -g jake` to install Jake globally
 1. `$ npm install -g bower` to install Bower globally
 1. `$ bower install` to install Bower components
 1. `$ jake` to build the project
 1. `$ jake server` to start a server. Browsers connected to the server will
    automatically refresh if anything in `build/` changes
 1. Run Jake with `env=production` to build and minify source files
    and send them to the `public/` directory (e.g. `$ jake env=production`),
    or to serve the `public/` directory without livereload or source watching
    (e.g. `$ jake server env=production`)
 1. `$ jake test` runs the tests

## Adding packages

 * `$ npm install some-package --save`, for `npm` packages
 * `$ bower install some-package --save`, for `bower` components

## Best practices

 * Prefer `npm` modules over 'bower' components; if you can install an external
   JavaScript library with either `npm` or `bower`, use `npm`.

## TODO

 * Start using react!
 * Add in the basic genetic algorithm
