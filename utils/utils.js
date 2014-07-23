"use strict";

var stream = require('stream');
var fs = require('fs');
var path = require('path');
var Q = require('q');

// www.strongloop.com/strongblog/practical-examples-of-the-new-node-js-streams-api/
var CreateLiner = function () {
    var liner = new stream.Transform( { objectMode: true } );

    liner._transform = function (chunk, encoding, done) {
        var data = chunk.toString();
        if (this._lastLineData) {
            data = this._lastLineData + data;
        }

        var lines = data.split('\n');
        this._lastLineData = lines.splice(lines.length-1,1)[0];
        lines.forEach(this.push.bind(this));
        done();
    };

    liner._flush = function (done) {
        if (this._lastLineData) {
            this.push(this._lastLineData);
        }
        this._lastLineData = null;
        done();
    };

    return liner;
};


var configPath = path.join(__dirname, '../config.json');


var readConfig = function(res) {
    var config;
    var deferred = Q.defer();

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
        catch (error) {
            console.log('There has been an error parsing your JSON.');
            console.log(error);
        }

        deferred.resolve(config);
    });

    return deferred.promise;
};


var writeConfig = function(res, config) {
    var deferred = Q.defer();

    config = JSON.stringify(config);

    fs.writeFile(configPath, config, function (err) {
        if (err) {
            res.send(400, 'File Write Error');
            throw err;
        }
        deferred.resolve(config);
    });

    return deferred.promise;
};


module.exports = {
    CreateLiner : CreateLiner,
    readConfig  : readConfig,
    writeConfig : writeConfig
};