# gulp-angular-order

Gulp plugin to order AngularJS source files by directory and type.

See below for how it works.

## Installation

    npm install gulp-angular-order

## Basic Usage

```javascript
var gulp = require("gulp");
var concat = require('gulp-concat');
var angularOrder = require('gulp-angular-order');

gulp.task('build', function () {
    return gulp.src('src/**/*.js')
        .pipe(angularOrder())
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('dist'));
});
```

## Options

Below is a list of optional options:

-   `base`: The relative path to the root of the application. The default is the current directory.
-   `types`: An array of types, in descending order. The default is `['service', 'controller', 'directive', 'filter', 'module']`.

## `SortFiles` Function

The plugin also exports the `sortFiles` function, to allow sorting files using the Angular Order when not working with Gulp. The function expects an array of files with a `path` property, and can optionally be passed the options above.

## How it works

The plugin has two expectations, based on the recommended [Style Guide](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md):

1.  Each folder in the application contains an AngularJS module, defined in its own file
2.  Each file contains one of the AngularJS types, which is included in the file name

Example app structure:

```javascript
app/
    app.module.js
    app.config.js
    people/
        attendees.html
        attendees.controller.js
        people.routes.js
        people.module.js
        speakers.html
        speakers.controller.js
        speaker-detail.html
        speaker-detail.controller.js
    sessions/
        sessions.html
        sessions.controller.js
        sessions.routes.js
        sessions.service.js
        session-detail.html
        session-detail.controller.js
        sessions.module.js
```

The plugin will then order the folders based on folder depth, so that child folders are sorted before parent folders. The reason is that child module export a module reference that the parent folder can then use to declare its dependencies.

```javascript
// people/speakers.controller.js
var app = app || {};
var people = app.people || (app.people = {});

(function () {
    function SpeakersController() {
        ...
    }

    SpeakersController.prototype ...

    people.SpeakersController = SpeakersController;
})

// people/people.module.js:
var app = app || {};
var people = app.people || (app.people = {});

(function () {
    var module = angular.module('app.people', [])
        .config(peopleRoutes)
        .controller('speakers', [
            ...,
            app.people.SpeakersController // SpeakersController must already be loaded
        ])
        ...

    people.module = module;

}());

// app.module.js
var app = app || {};

(function () {
    // Internal application module
    angular.module('app', [
        app.people.module.name // This must already be loaded
    ]);

    // External application module (ex. in ng-app directive)
    angular.module('SampleApp', ['app']);
});
```

Once the folders have been sorted, the files within each folder are sorted based on their type. By default the order will be Services, Controllers, Directives, Filters, and then Modules. The plugin will try to leave files whose file name doesn't include a type or whose type does not appear in the `types` array in their original position.

In the example application above, the sorted output will be as follows:

    app/people/attendees.controller.js
    app/people/speakers.controller.js
    app/people/people.routes.js
    app/people/speaker-detail.controller.js
    app/people/people.module.js
    app/sessions/sessions.service.js
    app/sessions/sessions.controller.js
    app/sessions/sessions.routes.js
    app/sessions/session-detail.controller.js
    app/sessions/sessions.module.js
    app/app.config.js
    app/app.module.js

To customize the order of files, you can specify your own `types` array in the options.

## Tips

1.  If you use TypeScript with `namespaces`, it will generate the boilerplate code to contain your code. All you need to do is declare exports in the namespace.

2.  If you use ES6/ES2015 Module syntax, this all becomes less of any issue, but will require you to use a Module loader or bundler (Webpack, Browserify, SystemJS, etc.)
