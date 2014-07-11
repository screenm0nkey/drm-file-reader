var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var liner = require('./liner');
var fileIn = path.join(__dirname, '../users_local.yml');

var readStream = fs.createReadStream(fileIn);
var readLine = new liner();
readStream.pipe(readLine);
var dataArray = [];
var match = false;
var userFound = false;
var username = 'markeych';
var previousLine;

readLine.on('readable', function (data) {
    var line;
    while (line = readLine.read()) {
        // reset all enabled users as disabled
        if (/user:/.test(line)) {
            line = '#user:'
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

//d

readLine.on('end', function () {
    var file1Out = path.join(__dirname, '../test1.yml');
    var file2Out = path.join(__dirname, '../test2.yml');
    var dataOut = dataArray.join('');

    fs.writeFile(file1Out, dataOut, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
    fs.writeFile(file2Out, dataOut, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
});






module.exports = router;
/**
 * Created by nicklowman on 04/07/2014.
 */
