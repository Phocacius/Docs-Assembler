'use strict';
const utils = require(__dirname + '/utils');
const fs = require("fs");
const path = require('path');
const dust = require('dustjs-helpers');

class Assembler {

    constructor() {
        this.templatePath = __dirname + path.sep + "templates" + path.sep;
    }

    prepare() {
        this.data = {
            pageTitle: this.config.pageTitle || 'Documentation',
            menuTitle: this.config.menuTitle || 'Documentation',
            stylesheets: [],
            contentSeparator: this.config.contentSeparator || '<hr>',
            javascripts: [],
            jquery: false
        };

        utils.emptyDir(this.config.outputDir);
        this.loadStylesheets();
        this.loadDustTemplates();
    }

    assemble() {
        const content = this.analyseFolder(this.config.docsRoot);
        this.writeHomepage(content);
        this.writeFiles(this.config.outputDir + path.sep, content.menu, '');
        this.copyAdditionalFiles(content.additionalFiles);
    }

    loadStylesheets() {
        fs.mkdirSync(this.config.outputDir + path.sep + 'css');
        const stylesheets = this.config.stylesheets || [];
        for (let index in stylesheets) {
            var basename = path.basename(stylesheets[index]);
            utils.copyFile(stylesheets[index], this.config.outputDir + path.sep + "css" + path.sep + basename);
            this.data.stylesheets.push("css" + path.sep + basename);
        }
    }

    loadDustTemplates() {
        const templates = fs.readdirSync(this.templatePath);
        for (let index in templates) {
            dust.compileFn(fs.readFileSync(this.templatePath + templates[index], "utf-8"), templates[index].split('.')[0]);
        }
        dust.helpers.menulevel = function (chunk, context, bodies, params) {
            var level = params.level || 0;
            var tree = context.get('navtree');
            var dir = context.get('dir').split(/[\/\\]/);
            var currentLevel = context.get('currentLevel');

            for(let tmpLevel in tree) {

                if(tree[tmpLevel] == dir[tmpLevel]) {
                    chunk = chunk.write(' active');

                    if(level == tmpLevel) {
                        chunk = chunk.write(' current');
                    }
                }
            }

            return chunk;
        }
    }

    analyseFolder(folder) {
        let data = {
            content: [],
            menu: [],
            pathPrefix: '',
            additionalFiles: [],
            title: utils.parseTitle(folder.split(path.sep).pop()),
            dir: folder.replace(this.config.docsRoot + path.sep, "")
        };

        try {
            var files = fs.readdirSync(folder);
        } catch (e) {
            throw new Error("Could not read from directory " + folder);
        }

        for (let index in files) {
            if (files[index] == 'Thumbs.db' || files[index] == '.DS_Store') continue;

            let filePath = path.join(folder, files[index]);

            if (fs.statSync(filePath).isFile()) {

                let extname = path.extname(filePath).toLowerCase();

                if (['.gif', '.jpg', '.jpeg', '.png', '.mp3', '.mp4', '.ogg', '.ogv'].indexOf(extname) >= 0) {
                    data.additionalFiles.push(path.basename(filePath));
                    continue;
                }

                var fileContents = fs.readFileSync(filePath, "utf-8");
                var tmp = utils.separateConfigAndContent(fileContents, extname, this.config.iniSeparator);

                if (tmp.config.menuTitle) {
                    data.title = tmp.config.menuTitle;
                }

                data.content.push({
                    content: this.parser.parse(extname, tmp.content, tmp.config),
                    title: tmp.config.title || utils.parseTitle(path.parse(files[index]).name)
                });
            }
            else {
                data.menu.push(this.analyseFolder(filePath));
            }
        }

        return data;
    };

    writeHomepage(content) {
        this.data.isHome = true;
        this.data.navtree = [];
        this.data.currentLevel = 0;

        this.data.menu = content.menu;
        this.data.content =  content.content;
        dust.render('index', this.data, (err, res) => {
            fs.writeFileSync(this.config.outputDir + path.sep + "index.html", res);
        });
    }

    writeFiles(folder, data, pathPrefix) {
        
        this.data.isHome = false;

        for(var index in data) {

            this.data.content = data[index].content;
            this.data.pathPrefix = pathPrefix;

            let newPath = this.config.outputDir + path.sep + data[index].dir;
            this.data.url = data[index].dir + ".html";
            this.data.navtree = data[index].dir.split(/[\/\\]/);
            this.data.currentLevel = this.data.navtree.length - 1;

            dust.render('index', this.data, (err, res) => {
                fs.writeFileSync(newPath + ".html", res);
            });

            this.copyAdditionalFiles(
                data[index].additionalFiles,
                this.config.docsRoot + path.sep + data[index].dir,
                null
            );

            if(data[index].menu.length) {
                fs.mkdirSync(newPath);
                this.writeFiles(newPath + path.sep, data[index].menu, '../' + pathPrefix);
            }
        }
    };

    copyAdditionalFiles(files, srcDir = null, dstDir = null) {
        
        for(var j in files) {
            var srcFile = (srcDir || this.config.docsRoot) + path.sep + files[j];
            var dstFile = (dstDir || this.config.outputDir) + path.sep + files[j];

            if(fs.existsSync(dstFile)) {
                console.warn("WARN: File " + dstFile + " already exists. Please use another filename!");
            }
            utils.copyFile(srcFile, dstFile);
        }
    }
}

module.exports = new Assembler;