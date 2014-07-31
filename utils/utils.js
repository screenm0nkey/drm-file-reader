"use strict";

var stream = require('stream');
var fs = require('fs');
var path = require('path');
var Q = require('q');

var configPath = path.join(__dirname, '../config.json');


var message = function (res) {
    return {
        error : function (message) {
            res.send(418, {
                type : 'error',
                message : message
            });
        },
        success : function (message) {
            res.send(200, {
                type : 'success',
                message : message
            });
        }
    };
};


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


var readConfig = function(res) {
    var config;
    var deferred = Q.defer();

    fs.readFile(configPath, function (err, data) {
        if (err) {
            message(res).error('Error reading config file');
            throw err;
        }

        try {
            config = JSON.parse(data);
        }
        catch (error) {
            console.log('There has been an error parsing your JSON.');
            console.log(error);
        }

        if (!Object.keys(config).length) {
            message(res).error('Your config object is empty. It needs at least one file path.');
            throw new Error('Your config object is empty. It needs at least one file path.');
        }

        deferred.resolve(config);
    });

    return deferred.promise;
};


var writeConfig = function(res, config) {
    var deferred = Q.defer();

    fs.writeFile(configPath, JSON.stringify(config), function (err) {
        if (err) {
            message(res).error('Error writing config file');
            throw err;
        }
        deferred.resolve(config);
    });

    return deferred.promise;
};



module.exports = {
    CreateLiner : CreateLiner,
    readConfig  : readConfig,
    writeConfig : writeConfig,
    message     : message
};