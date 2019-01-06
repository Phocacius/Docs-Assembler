#!/usr/bin/env node --harmony
'use strict';

const program = require('commander');
const fs = require('fs');
const path = require('path');
const parse = require("jsdoc-parse");
const dust = require('dustjs-helpers');

program
    .arguments('<input>', 'The input js file')
    .arguments('<output>', 'The output apib file')
    .parse(process.argv);


if(program.args.length < 2) {
    program.help();
    // exits automatically
}


let input = program.args[0];
let output = program.args[1];

dust.config.whitespace = true;
dust.compileFn(fs.readFileSync(__dirname + path.sep + 'templates' + path.sep + 'function.tmpl', "utf-8"), 'function');
dust.helpers.formatType = function (chunk, context, bodies, params) {
    var param = params.type;

    if(typeof(param) == 'string') {
        return chunk.write(type);
    }
    if(param.length === 1) {
        return chunk.write(param[0]);
    }
    return chunk.write('(' + param.join('|') + ')');
};

const stream = parse({ src: input });
stream.on('data', (data) => {
    data = JSON.parse(data);
    
    let context = {
        host: '### HOST ###',
        title: 'Asil API',
        data: data
    };
    
    dust.render('function', context, (err, out) => {
        fs.writeFileSync(output, out);
    });

    // const apib = "pre = 1\n----\n" + JSON.stringify(data, null, 3);
    
});

// console.log(parsed);


