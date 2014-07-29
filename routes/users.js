"use strict";

var express = require('express');
var fs = require('fs');
var path = require('path');
var utils = require('./../utils/utils');
var router = express.Router();


/* GET users listing. */
router.get('/', function(req, res) {
    utils.readConfig(res).then(function(config){
        if (!config.files.length) {
            res.send(418, ['Config contains no files. Please add users_local.yml file']);
        }
        var fileIn = config.files[0].path;

        if (!fs.existsSync(fileIn)) {
            res.send(418, ['The file "' + fileIn + '" does not exist.']);
            return;
        }

        var readStream = fs.createReadStream(fileIn);
        var readLine = new utils.CreateLiner();
        var users = [];
        var user = {};

        readStream.pipe(readLine);

        readLine.on('readable', function () {
            var line;

            while (line = readLine.read()) {
                var tline = line.trim();

                switch(true) {
                    // create new user when we encounter the 'user' line
                    case (/user:$/.test(tline)):
                        if (user.username) {
                            // put the previous user object into.
                            users.push(user);
                        }
                        user = {};
                        if (/^user/.test(line)) {
                            user.selected = true;
                        }
                        break;
                    // add username
                    case (/^username/.test(tline)):
                        user.username = tline.replace(/username:\s+/, '');
                        break;
                    // add first name
                    case (/^firstName/.test(tline)):
                        user.name = tline.replace(/firstName:\s+/, '');
                        break;
                    // add last name
                    case (/^lastName/.test(tline)):
                        user.name = user.name + ' ' + tline.replace(/lastName:\s+/, '');
                        break;
                    // add group
                    case (/DRM_/.test(tline)):
                        user.group = tline.replace(/-\s+/, '');
                        break;
                }
            }
        });

        readLine.on('end', function () {
            // add last user if it hasn't already been added.
            if (users[users.length-1] !== user) {
                if (user.username === 'super_approver') {
                    user.group = 'SUPERUSER';
                }
                users.push(user);
            }
            // send users back
            res.send(201, users);
        });
    });
});



router.put('/:id', function(req, res) {
    utils.readConfig(res).then(function(config){
        var readLine = new utils.CreateLiner();
        var dataArray = [];
        var match = false;
        var userFound = false;
        var previousLine;
        var username = req.params.id;
        var name = req.body.name;
        var fileIn = path.join(config.files[0].path);
        var readStream = fs.createReadStream(fileIn);

        readStream.pipe(readLine);

        readLine.on('readable', function () {
            var line;

            while (line = readLine.read()) {
                // reset all enabled users as disabled
                if (/user:/.test(line)) {
                    line = '#user:';
                }

                // enable the matching user.
                var newLine = match ? 'user:\n' : line+'\n';

                // add a new line after each user object as they get removed when the file is read.
                if (/DRM_/.test(previousLine) && !/DRM_/.test(newLine)) {
                    dataArray.push('\n');
                }

                dataArray.push(newLine);
                match = false;

                // if there is a username match then property on the next line will be 'user'
                if (username + ':' === line) {
                    match = true;
                    userFound = true;
                }

                previousLine = newLine;
            }
        });


        readLine.on('end', function () {
            var dataOut = dataArray.join('');

            config.files.forEach(function (file) {
                fs.writeFileSync(file.path, dataOut);
            });

            if (!userFound) {
                res.send(300, {
                    type : 'error',
                    error : 'No user found for "' + name + '"'
                });
            } else {
                res.send(201, {
                    type: 'success',
                    message : 'Files updated for "' + name + '"'
                });
            }
        });
    });
});


module.exports = router;
