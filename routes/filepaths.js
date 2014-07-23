"use strict";

var express = require('express');
var fs = require('fs');
var path = require('path');
var utils = require('./../utils/utils');
var router = express.Router();


router.get('/', function(req, res) {
    utils.readConfig(res).then(function(config){
        res.send(200, config);
    });
});


router.post('/', function(req, res) {
    utils.readConfig(res).then(function(config){
        var nextId;
        var fileIn = req.body.path;

        if (!fs.existsSync(fileIn)) {
            res.send(418, 'The file "' + fileIn + '" does not exist.');
            return;
        }

        if (config.files.length) {
            nextId = config.files[config.files.length-1].id + 1;
        } else {
            nextId = 1;
        }

        config.files.push({
            id : nextId,
            path : fileIn
        });

        utils.writeConfig(res, config).then(function(config){
            res.send(200, config);
        });
    });
});


router.delete('/:id', function(req, res) {
    utils.readConfig(res).then(function(config){
        config.files = config.files.filter(function(file) {
            return file.id !== parseInt(req.params.id);
        });

        utils.writeConfig(res, config).then(function(config){
            res.send(200, config);
        });
    });
});



module.exports = router;
