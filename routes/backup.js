var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var liner = require('./liner');


/* GET users listing. */
router.get('/', function(req, res) {
    var fileIn = path.join(__dirname, '../users_local.yml');
    var source = fs.createReadStream(fileIn);
    var readLine = new liner();
    var users = [];
    var user = {};

    source.pipe(readLine);

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
                user.group = 'SUPERUSER'
            }
            users.push(user);
        }
        // send users back
        res.send(201, {
            users : users
        });
    });
});



router.put('/:id', function(req, res) {
    var fileIn = path.join(__dirname, '../users_local.yml');
    var fileOut = path.join(__dirname, '../test.yml');
    var source = fs.createReadStream(fileIn);
    var readLine = new liner();
    var match = false;
    var userFound = false;
    var username = req.params.id;

    // empty the new file.
    fs.writeFile(fileOut, '', function(err) {});

    source.pipe(readLine);
    readLine.on('readable', function () {
        var line;
        while (line = readLine.read()) {
            // reset all enabled users as disabled
            if (/user:/.test(line)) {
                line = '#user:'
            }

            // enable the matching user.
            var nline = match ? 'user:\n' : line+'\n';

            fs.appendFile(fileOut, nline, function (err) {});
            match = false;

            // add new line end of each user role
            if (/DRM_/.test(nline) && username) {
                fs.appendFile(fileOut, '\n', function (err) {});
            }
            // if there is a username match then property on the next line will be 'user'
            if (username + ':' === line) {
                match = true;
                userFound = true;
            }
        }
    });

    readLine.on('end', function () {
        // delete old file
        fs.unlinkSync(fileIn);
        // rename new file
        fs.renameSync(fileOut, path.join(__dirname, '../users_local.yml'));

        if (!userFound) {
            res.send(400, {
                error : 'No user found with "' + username + '"'
            });
        } else {
            res.send(201, {
                message : 'File was saved for ' + username
            })
        }
    });
});





// read/write
//router.put('/old:id', function(req, res) {
//    var fileIn = path.join(__dirname, '../buzap.yml');
//    var fileOut = path.join(__dirname, '../test.yml');
//
//    fs.readFile(fileIn, 'utf8', function(err, data) {
//        if (err) throw err;
//
//        fs.writeFile(fileOut, data, function(err) {
//
//        });
//    });
//});



//read
//router.put('/:id', function(req, res) {
//    var file = path.join(__dirname, '../test.yml');
//    var content = "Hey there \n   " + req.params.id;
//
//    fs.writeFile(file, content, function(err) {
//        if(err) {
//            console.log(err);
//        } else {
//            // a 201 is created. normally for a post
//            res.send(201, {
//                message : 'File was saved for ' + req.params.id
//            });
//        }
//    });
//});

module.exports = router;
