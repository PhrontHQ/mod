
# Mod

[![npm version](https://img.shields.io/npm/v/mod.svg?style=flat)](https://www.npmjs.com/package/mod)

[![Build Status](https://travis-ci.org/mod/mod.svg?branch=master)](http://travis-ci.org/mod/mod)

[![Analytics](https://ga-beacon.appspot.com/UA-35717912-2/mod/mod)](https://github.com/mod/mod)


Mod is a new type of application stack powered by standard web technologies. It is designed with the ambition to ship moddable apps, giving the ability to non-coders and coders like, to mod it their own. eye toward maintainability and performance, Mod simplifies the development of rich HTML5 applications by providing modular components, real-time two-way data binding, object serialization with DOM mapping, event handling, a managed component draw cycle, CommonJS dependency management, full-stack Object Relational Meshing working client-side and in serverless-native workers in node.js. Those workwers have been deployed and used on AWS.
 
## Encapsulated Components

Mod has a clean interface for creating custom user interface components. Each component can stand alone or be composed of other components. Each component is modeled as a stand-alone web application with its own HTML template, JavaScript, CSS, serialized component object model, and resources. With few exceptions, a component can stand on the web platform like any other web page. There are no fully JavaScript-driven templates in Mod. This separation of concerns allows designers to use the technologies they are comfortable with (without having to dig into the JavaScript) and developers to isolate and test individual components using familiar techniques.

## Declarative Data Binding

Mod makes it easier to manage your application and UI state with data bindings. A UI component or Mod object can establish a simple or bi-directional binding with another component or object. When the bound property, or deeper property path, of the bound object is updated then the source object is kept in sync.

Mod uses functional reactive bindings ([FRB](https://github.com/mod/frb)). Unlike “traditional” bindings, FRB can gracefully bind long property paths and the contents of collections. They can also incrementally update the results of chains of queries including maps, flattened arrays, sums, and averages as well as add and remove elements from sets based on the changes to a flag. FRB makes it easy to incrementally ensure consistent state. FRB is built from a combination of powerful functional and generic building blocks, making it reliable, easy to extend, and easy to maintain.

For more information, see [FRB](https://github.com/mod/frb).

## CommonJS

Mod fully supports [CommonJS](http://www.commonjs.org/) modules and is a part of the Node and npm package ecosystem.

For more information, see [CommonJS](https://github.com/mod/...[TBD]).

# Requirements
To get started with Mod, you will need the following:

* Node.js and npm. Mod application development depends on npm, which is distributed with Node.js.
* A recent stable release of Chrome, Safari or Firefox. Mod is intended to leverage the evolving web platform of modern browsers.
* To contribute: A Git client and public SSH key. For details on installing Git and creating your key, see the setup guides on github.com.

# Quick Setup
To start using Mod, follow these steps:

1. [Download](http://nodejs.org/download/) and run the prebuilt Node.js installer for your platform from the Node.js website.

2. Install `minit`, the Mod Initializer.

    `minit` is a command line utility that will help kickstart your Mod project by generating prebuilt Mod application templates and components and placing the associated files inside the proper directories of your project.

    **Mac OS X / Linux**

    ```
    $ mkdir -p ~/.npm
    $ sudo npm install -gq minit@latest
    ```

    **Windows**

    Run the "Node.js command prompt"

    ```
    $ npm install -gq minit@latest
    ```

3. Use `minit` to create your Mod project:

    ```
    $ minit create:app -n yourappname
    ```

    **Note**: If you get an EACCES warning when trying to run `minit:create`, use `sudo chown -R <username> ~/.npm` and then use `$ minit create:app -n hello`. This is a workaround due to a bug in npm.

    This generates a new directory—yourappname, which contains the default Mod application template, including the production dependencies—in your current directory.

4. To verify your installation, switch to yourappname directory and serve your new Mod project using `minit`:

    ```
    $ cd yourappname
    $ minit serve &
    ```

5. Point your browser to http://localhost:8083/.

    You should see the contents of the Welcome component—a simple single-page application, which is explicitly loaded to accompany our two-part [quick start tutorial](http://mod.org/docs/mod-setup.html) tutorial.

## Where to Go from Here
For a quick introduction on how to assemble Mod components into a user interface, refer to [“Hello Mod”](http://mod.org/docs/hello-mod.html) in our Quick Start tutorial.
For more information on Mod components, bindings, event handling, serialization etc. refer to the [documentation](http://mod.org/docs/) (be patient: we are currently in the process of updating the docs).

## Maintenance

Tests are in the `test` directory. Use `npm test` to run the tests in
NodeJS or open `test/run.html` in a browser. 

To run the tests in your browser, simply use `npm run test:jasmine`.

To run the tests using Karma use `npm run test:karma` and for continious tests run with file changes detection `npm run test:karma-dev`. Finally to open a remote debug console on karma use `npm run test:karma-debug`.
