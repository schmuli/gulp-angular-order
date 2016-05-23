var path = require('path');
var through = require('through2');

module.exports = function (options) {
    var files = [];

    return through.obj(onFile, onEnd);

    function onFile(file, enc, cb) {
        files.push(file);
        cb();
    }

    function onEnd(cb) {
        var sorted = sort(files, options);
        for (var i = 0; i < sorted.length; i += 1) {
            this.push(sorted[i]);
        }

        cb();
    }
};

module.exports.sortFiles = sort;

function sort(files, options) {
    options = options || {};
    var base = options.base || '';
    var types = options.types || ['service', 'controller', 'directive', 'filter', 'module'];

    var sorted = [];
    var indexed = {};

    files.forEach(function (file, index) {
        if (isSubpath(base, file.path)) {
            sorted.push(stats(base, file));
        } else {
            indexed[index] = file;
        }
    });

    sorted.sort((a, b) => sortFile(a, b, types));

    var result = [];
    for (var i = 0, sortedIndex = 0; i < files.length; i += 1) {
        var file = indexed[i];
        if (!file) {
            file = sorted[sortedIndex].file;
            sortedIndex += 1;
        }
        result.push(file);
    }
    return result;
}

function isSubpath(base, subpath) {
    return path
        .relative(base, subpath)
        .indexOf('..') === -1;
}

function sortFile(a, b, types) {
    var dirSort = a.dir.localeCompare(b.dir);
    if (dirSort !== 0) {
        return -dirSort;
    }
    var typeSort = compareTypes(a.type, b.type, types);
    if (typeSort !== 0) {
        return typeSort;
    }
    var nameSort = a.name.localeCompare(b.name);
    return nameSort;
}

function compareTypes(typeA, typeB, types) {
    var indexA = types.indexOf(typeA);
    var indexB = types.indexOf(typeB);
    return indexA - indexB;
}

function stats(base, file) {
    var relative = path.relative(base, file.path);
    var dir = path.dirname(relative);
    var name = path.basename(relative, '.js');
    var extension = path.extname(name);

    return {
        file: file,
        dir: dir !== '.' ? dir : String.fromCharCode(0x32),
        name: name,
        type: name !== 'module' ? extension.substr(1) : name
    };
}
