"use strict";

let path = require('path');
let through = require('through2');

module.exports = function (options) {
    let files = [];

    return through.obj(onFile, onEnd);

    function onFile(file, enc, cb) {
        files.push(file);
        cb();
    }

    function onEnd(cb) {
        let sorted = sort(files, options);
        for (let i = 0; i < sorted.length; i += 1) {
            this.push(sorted[i]);
        }

        cb();
    }
};

const TYPES = ['service', 'controller', 'directive', 'filter', 'routes', 'config', 'module'];

module.exports.sortFiles = sort;

function sort(files, options) {
    options = options || {};
    let base = options.base || '';
    let types = options.types || TYPES;

    let sorting = [];
    let indexed = {};

    files.forEach(function (file, index) {
        if (isSubpath(base, file.path)) {
            sorting.push(stats(base, file));
        } else {
            indexed[index] = file;
        }
    });

    let sorted = sortFiles(sorting, types, options.special);

    let result = [];
    for (let i = 0, sortedIndex = 0; i < files.length; i += 1) {
        let file = indexed[i];
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
    let folder;
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

function specialSorter(a, b, special) {
    let specialA = special.indexOf(a.name);
    let specialB = special.indexOf(b.name);

    if (specialA === -1 && specialB === -1) {
        return 0;
    }

    if (specialA !== -1 && specialB !== -1) {
        return specialA - specialB;
    }

    return specialA !== -1 ? -1 : 1;
}

function recurseSort(parent, types, result, special) {
    parent.folders.sort((a, b) => {
        if (special) {
            let specialSort = specialSorter(a, b, special);
            if (specialSort !== 0) {
                return specialSort;
            }
        }
        return a.name.localeCompare(b.name);
    });
    parent.folders.forEach(folder => recurseSort(folder, types, result));

    parent.files.sort((a, b) => compareTypes(a.type, b.type, types));
    parent.files.forEach(file => result.push(file));
}

function sortTree(tree, types, special) {
    let result = [];
    recurseSort(tree, types, result, special);
    return result;
}

function compareTypes(typeA, typeB, types) {
    let indexA = types.indexOf(typeA);
    let indexB = types.indexOf(typeB);
    return indexA - indexB;
}

function stats(base, file) {
    let relative = path.relative(base, file.path);
    let dir = path.dirname(relative);
    let name = path.basename(relative, '.js');
    let extension = path.extname(name);

    return {
        file: file,
        dir: dir !== '.' ? dir.split(path.sep) : [],
        name: name,
        type: name !== 'module' ? extension.substr(1) : name
    };
}
