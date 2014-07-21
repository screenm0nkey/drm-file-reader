"use strict";

var express = require('express');
var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var router = express.Router();


router.get('/', function(req, res) {
    utils.getConfig(res, function(config){
        res.send(200, config);
    });
});


router.post('/', function(req, res) {
    utils.getConfig(res, function(config){
        var nextId = config.files[config.files.length-1].id + 1;

        config.files.push({
            id : nextId,
            path : req.body.path
        });

        var configJSON = JSON.stringify(config);

        fs.writeFile(utils.configPath, configJSON, function (err) {
            if (err) {
                res.send(400, 'ERROR');
                throw err;
            }
            res.send(200, configJSON);
        });
    });
});


router.delete('/:id', function(req, res) {
    utils.getConfig(res, function(config){
        config.files = config.files.filter(function(file) {
            return file.id !== parseInt(req.params.id);
        });

        config = JSON.stringify(config);

        fs.writeFile(utils.configPath, config, function (err) {
            if (err) {
                res.send(400, 'ERROR');
                throw err;
            }
            res.send(200, config);
        });
    });
});


module.exports = router;
