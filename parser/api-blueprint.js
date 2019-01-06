var aglio = require('aglio');
const fs = require("fs");
const path = require('path');


const APIBlueprintParser = function() {};

APIBlueprintParser.prototype.init = function(assembler) {
    assembler.data.javascripts.push(fs.readFileSync(__dirname + path.sep + 'api-blueprint-frontend.js'));
};

APIBlueprintParser.prototype.parse = function(content, config) {

    const templateFile = config.noRest ? 'code-blueprint.jade' : 'api-blueprint.jade';

    const options = {
        themeTemplate: __dirname + path.sep + '..' + path.sep + 'templates' + path.sep + templateFile,
        theme: 'kaiten'
    };

    const promise = new Promise((resolve, reject) => {
        aglio.render(content, options, function (err, out) {
            if (err) {
                console.log('API Blueprint Parser: ', err);
                reject(err);
            }

            resolve(out);
        });
    });
    
    return promise;
};

module.exports = APIBlueprintParser;