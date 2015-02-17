var path = require('path');
var through = require('through2');

module.exports = function (options) {
    options = options || {};

    var files = [];
    var base = options.base || '';
    var types = options.types || ['service', 'controller', 'directive', 'module'];
    
    return through.obj(onFile, onEnd);

    function onFile(file, enc, cb) {
        files.push(file);
        cb();
    }
    
    function onEnd(cb) {
        var sorted = sortFiles();
        for(var i = 0; i < sorted.length; i += 1) {
            this.push(sorted[i]);
        }

        cb();
    }
    
    function sortFiles() {
        var sorted = [];
        var indexed = {};
        
        files.forEach(function (file, index) {
            if (isSubpath(file.path)) {
                sorted.push(stats(file));
            } else {
                indexed[index] = file;
            }
        });
        
        sorted.sort(function (a, b) {
            var dirSort = a.dir.localeCompare(b.dir);
            var typeSort = compareTypes(a.type, b.type);
            return dirSort !== 0 ? dirSort : typeSort;
        });
        
        var result = [];
        for(var i = 0, sortedIndex = 0; i < files.length; i += 1) {
            var file = indexed[i];
            if (!file) {
                file = sorted[sortedIndex].file;
                sortedIndex += 1;
            }
            result.push(file);
        }
        return result;
    }
    
    function isSubpath(subpath) { 
        return path
            .relative(base, subpath)
            .indexOf('..') === -1;
    }
    
    function compareTypes(typeA, typeB) {
        var indexA = types.indexOf(typeA);
        var indexB = types.indexOf(typeB);
        return indexA - indexB;
    }
    
    function stats(file) {
        var dir = path.dirname(file.relative);
        var name = path.basename(file.relative, '.js');
        return {
            file: file,
            dir: dir !== '.' ? dir : String.fromCharCode(0xFFF),
            name: name,
            type: name !== 'module' ? path.extname(name).substr(1) : name
        };
    }
};
