// Include dependencies
const socketio = require('socket.io');
const express = require('express');
const path = require('path');
const ytlist = require('youtube-playlist');
const chalk = require('chalk');
const ejs = require('ejs');
const remotemedia = require('./src/rm/server');

// Classes
const logging = require('./src/rm/logging');

const indexRouter = require('./routes/index');

// Constants 
const port = 3694;

logging.withTime("[INFO] Starting remote-media...");
logging.withTime("[INFO] Starting express...");

//create express object
var expApp = express();
expApp.set('view engine', 'ejs')
expApp.use(indexRouter);
require.main.require(path.join(__dirname, '/routes/static'))(expApp);

//use it to serve pages from the web folder
expApp.use(express.static('web'));
// expApp.use(indexRouter);

var web = expApp.listen(port);

remotemedia.start(web);