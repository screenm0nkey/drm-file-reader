"use strict";

var stream = require('stream');
var fs = require('fs');
var path = require('path');

// www.strongloop.com/strongblog/practical-examples-of-the-new-node-js-streams-api/
var CreateLiner = function () {
    var liner = new stream.Transform( { objectMode: true } );

    liner._transform = function (chunk, encoding, done) {
        var data = chunk.toString();
        if (this._lastLineData) {
            data = this._lastLineData + data
        };

        var lines = data.split('\n');
        this._lastLineData = lines.splice(lines.length-1,1)[0];
        lines.forEach(this.push.bind(this));
        done();
    }

    liner._flush = function (done) {
        if (this._lastLineData) {
            this.push(this._lastLineData);
        }
        this._lastLineData = null
        done();
    }

    return liner;
}


var configPath = path.join(__dirname, '../config.json');


var getConfig = function(res, cb) {
    var config;

    fs.readFile(configPath, function (err, data) {
        if (err) {
            res.send(400, 'File Request Error');
            throw err;
        }

        try {
            config = JSON.parse(data);
            if (!Object.keys(config).length) {
                throw new Error('Your config object is empty. It needs at least one file path.');
            }
        }
        catch (err) {
            console.log('There has been an error parsing your JSON.');
            console.log(err);
        }

        cb(config);
    });
};


module.exports = {
    CreateLiner : CreateLiner,
    configPath  : configPath,
    getConfig   : getConfig
};