'use strict';
const fs = require('fs');
const path = require('path');
const ini = require('ini');


const emptyDir = function (dirPath, isTopDir) {
    try {
        var files = fs.readdirSync(dirPath);
    } catch (e) {
        fs.mkdirSync(dirPath);
        return;
    }
    if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
            var filePath = path.join(dirPath, files[i]);

            if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
            else {
                var parts = filePath.split('/');
                if(parts[parts.length - 1].substr(0, 1) !== '.') {
                    emptyDir(filePath, false);
                }
            }
        }
    }
    if(isTopDir === false) {
        fs.rmdirSync(dirPath);
    }
};

const separateConfigAndContent = function(fileContents, extName, separator) {
    var localConfig = null, localContent = null;
    var splitted = fileContents.split(separator);
    if(splitted.length === 1) {
        if(extName === '.ini') {
            localConfig = splitted[0];
        } else {
            localContent = splitted[0];
        }
    } else {
        localConfig = splitted[0];
        splitted.shift();

        localContent = splitted.join(separator)
    }

    if(localConfig !== null) {
        localConfig = ini.parse(localConfig);
    } else {
        localConfig = {};
    }
    return {
        config: localConfig,
        content: localContent
    };
};

const parseTitle = function(title) {
    var splitted = title.split('_');
    if(splitted.length > 1) {
        splitted.shift();
        title = splitted.join(' ');
    }
    return title.substr(0, 1).toUpperCase() + title.substr(1);
};

const copyFile = function(src, dest) {
    fs.createReadStream(src).pipe(fs.createWriteStream(dest));
};


module.exports = {
    emptyDir,
    separateConfigAndContent,
    parseTitle,
    copyFile
};
