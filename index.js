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
    var special = options.special || undefined;

    var sorting = [];
    var indexed = {};

    files.forEach(function (file, index) {
        if (isSubpath(base, file.path)) {
            sorting.push(stats(base, file));
        } else {
            indexed[index] = file;
        }
    });

    let sorted = sortFiles(sorting, types, special);

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

function sortFiles(files, types, special) {
    let tree = buildTree(files);
    return sortTree(tree, types, special);
}

function findOrCreateFolder(dir, parent) {
    for (let i = 0; i < dir.length; i += 1) {
        let name = dir[i];
        let folder = parent.folders.find(f => f.name === name);
        if (!folder) {
            folder = {
                name,
                files: [],
                folders: []
            };
            parent.folders.push(folder);
        }
        parent = folder;
    }

    return parent;
}

function buildTree(files) {
    let tree = {
        files: [],
        folders: []
    };

    files.forEach(file => {
        folder = findOrCreateFolder(file.dir, tree);
        folder.files.push(file);
    });

    return tree;
}

function recurseSort(parent, types, result) {
    parent.folders.sort((a, b) => a.name.localeCompare(b.name));
    parent.folders.forEach(folder => recurseSort(folder, types, result));

    parent.files.sort((a, b) => compareTypes(a.type, b.type, types));
    parent.files.forEach(file => result.push(file));
}

function sortTree(tree, types, special) {
    let result = [];
    recurseSort(tree, types, result, special);

    if (special) {
        result.sort((a, b) => {
            let specialA = special.indexOf(a.dir[0]);
            let specialB = special.indexOf(b.dir[0]);

            if (specialA === -1 && specialB === -1) {
                return 0;
            }

            if (specialA !== -1 && specialB !== -1) {
                return specialA - specialB;
            }

            return specialA !== -1 ? -1 : 1;
        });
    }

    return result;
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
        dir: dir !== '.' ? dir.split(path.sep) : [],
        name: name,
        type: name !== 'module' ? extension.substr(1) : name
    };
}
