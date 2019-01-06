'use strict';
const commonmark = require('commonmark');
const mdParser = new commonmark.Parser();
const htmlWriter = new commonmark.HtmlRenderer({safe: false});
const entities = new (require('html-entities').AllHtmlEntities)();


class Parser {
    
    constructor() {
        
        this.parsers = {};

        this.fileExtensions = {
            '.md': 'markdown',
            '.html': 'html',
            '.txt': 'text',
            '.apib': 'api-blueprint'
        };

        this.defaultParser = 'markdown';

        // simple parsers
        this.addParser('markdown', content => {
            const ast = mdParser.parse(content);
            return htmlWriter.render(ast);
        });

        this.addParser('html', content => {
            return content;
        });

        this.addParser('text', (content,options) => {
            return options.pre
                ? "<pre>" + entities.encode(content) + "</pre>"
                : entities.encode(content).replace("\n", "<br>");
        });
        
        // extended parsers
        this.addParser('api-blueprint', require(__dirname + '/parser/api-blueprint'));

    }

    parse(fileExt, content, config = {}) {
        let parser = config.parser || this.fileExtensions[fileExt] || this.defaultParser;
        return this.loadParser(parser)(content, config);
    }
    
    addParser(key, parsingClass) {
        if(typeof(parsingClass) === 'function') {

            if(parsingClass.prototype && typeof(parsingClass.prototype.parse) === 'function') {
                this.parsers[key] = {
                    class: parsingClass
                }
            } else {
                this.parsers[key] = parsingClass;
            }
            return;
        }

        return console.warn('WARN: The parsing class ' + parsingClass.constructor.name + " has no method parse, omitting");

    }


    loadParser(parser) {

        if(!this.parsers[parser]) {
            return function(content) {
                console.warn('WARN: The requested parser "' + parser + '" could not be found. Be sure to register it!');
                return entities.encode(content);
            };
        }

        if(typeof(this.parsers[parser]) === 'function') {
            return this.parsers[parser];
        }
        if(!this.parsers[parser].instance) {
            this.parsers[parser].instance = Object.create(this.parsers[parser].class.prototype);
            this.parsers[parser].instance.init(this.assembler);
        }
        return this.parsers[parser].instance.parse;
    }
    
}

module.exports = new Parser;