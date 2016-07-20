var sort = require('./index');
var sortFiles = sort.sortFiles;
var sorter = sort.sorter;

var basename = require('path').basename;

var input = [{
    path: 'app.module.js'
}, {
    path: 'first/first.service.js'
}, {
    path: 'second/second.controller.js'
}, {
    path: 'second/second.service.js'
}, {
    path: 'first/third/third.service.js'
}, {
    path: 'first/first.controller.js'
}, {
    path: 'app.routes.js'
}, {
    path: 'first/fourth/fourth.service.js'
}, {
    path: 'core/core.module.js'
}, {
    path: 'common/common.module.js'
}];

var expected = [
    'core/core.module.js',
    'common/common.module.js',
    'first/fourth/fourth.service.js',
    'first/third/third.service.js',
    'first/first.service.js',
    'first/first.controller.js',
    'second/second.service.js',
    'second/second.controller.js',
    'app.routes.js',
    'app.module.js'
];

var result = sortFiles(input, {
    types: ['service', 'controller', 'routes', 'module'],
    special: ['core', 'common']
}).map(f => f.path);

console.assert(result.toString() === expected.toString(), 'result is not as expected', result);
