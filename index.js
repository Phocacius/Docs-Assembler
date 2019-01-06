#!/usr/bin/env node --harmony
'use strict';
const fs = require("fs");
const path = require('path');
const utils = require(__dirname + '/utils');
const parser = require(__dirname + '/parser');
const assembler = require(__dirname + '/assembler');

const args = process.argv.slice(2);
const configFile = args[0] || 'config.json';


// Load config file, throw error if no config given
if (!fs.existsSync(configFile)) {
    throw new Error("No config file given, tried " + process.cwd() + path.sep + configFile);
}

const config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
const iniSeparator = config.iniSeparator || '----';

// Config Sanity checks
if (!config.outputDir) {
    throw new Error("Config is missing the required field 'outputDir'");
}
if (!config.docsRoot) {
    throw new Error("Config is missing the required field 'docsRoot'");
}


assembler.config = config;
assembler.parser = parser;
parser.assembler = assembler;


assembler.prepare();
assembler.assemble();


