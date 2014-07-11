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

        dataArray.push(newLine);
        match = false;

        // add new line end of each user role
        if (/DRM_/.test(newLine)) {
            dataArray.push('\n');
            // remove previous line if also contained DRM_
            if (dataArray[dataArray.length-1] === '\n') {
                dataArray.push('\nNICK');
            }

        }


        // if there is a username match then property on the next line will be 'user'
        if (username + ':' === line) {
            match = true;
            userFound = true;
        }


    }
});


readLine.on('end', function () {
    var fileOut = path.join(__dirname, '../test.yml');
    var dataOut = dataArray.join('');
    console.log(dataOut)
    fs.writeFile(fileOut, '', function(err) {});
    fs.writeFile(dataOut, '', function(err) {});
});






module.exports = router;
/**
 * Created by nicklowman on 04/07/2014.
 */
