// Include dependencies
const socketio = require('socket.io');
const express = require('express');
const path = require('path');
const ytlist = require('youtube-playlist');
const chalk = require('chalk');
const ejs = require('ejs')

// Classes
const server = require('./web/js/classes');
const rmUtils = require('./src/rm/utils');
const logging = require('./src/rm/logging');
const handlers = require("./src/rm/handlers");
const transmit = require('./src/rm/transmit');

const indexRouter = require('./routes/index');

// Constants 
const port = 3694;

logging.withTime("[INFO] Starting server...");
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


//get socketio to listen to the webserver's connection
//Create a callback function to deal with each connection.
//The callback contains code to setup what happens whenever a named message is received
function startServer() {
    //create blank logins array
    var defaultRoom = new server.Room(socketio.listen(web, { log: false }));

    defaultRoom.io.on('connection', function (socket) {
        // A new connection from a client

        // Create a new Login object with the new socket's ID and add to the room
        defaultRoom.addClient(new server.Login(socket.id, socket, socket.id));
        var currentClient = defaultRoom.clients[socket.id];

        // Send all data to new clients and admin panels
        transmit.sendQueue(defaultRoom);
        transmit.broadcastClients(defaultRoom);
        transmit.sendQueueStatus(defaultRoom);
        if (defaultRoom.currentVideo.state == 1) transmit.sendNowPlaying(defaultRoom, defaultRoom.currentVideo);
        socket.binary(false).emit('initFinished');

        logging.withTime(chalk.green("[CliMgnt] New Client " + currentClient.id));

        // The reciever's player has loaded
        socket.on("recieverPlayerReady", function () {
            handlers.RecieverPlayerReady(defaultRoom, currentClient);
        });

        // Acknowledge the reciever's nickname and let them know if it's valid or not
        socket.on('receiverNickname', (nick, fn) => {
            handlers.RecieverNickname(defaultRoom, currentClient, nick, fn);
        });

        // The client has finished preloading
        socket.on("recieverPlayerPreloadingFinished", function (videoID) {
            handlers.RecieverPreloadingFinished(defaultRoom, currentClient, videoID);
        });

        // Status of the reciever
        socket.on("recieverPlayerStatus", function (data) {
            handlers.RecieverPlayerStatus(defaultRoom, currentClient, data);
        });

        // Recieved video details from a reciever
        socket.on("recieverVideoDetails", function (videoDetails) {
            handlers.RecieverVideoDetails(defaultRoom, currentClient, videoDetails);
        });

        // The reciever has requested a timestamp
        socket.on('recieverTimestampRequest', (fn) => {
            handlers.RecieverTimestampRequest(defaultRoom, currentClient, fn);
        });

        socket.on("recieverTimestampSyncRequest", (timestamp) => {
            handlers.RecieverTimestampSyncRequest(defaultRoom, timestamp);
        });


        // All admin panel stuff //

        // Get new video and send to recievers
        socket.on("adminNewVideo", function (data) {
            return handlers.AdminNewVideo(defaultRoom, data);
        });

        socket.on("adminQueueAppend", function (data) {
            return handlers.AdminQueueAppend(defaultRoom, data);
        });

        // Text to speech
        socket.on("adminTTSRequest", function (data) {
            handlers.AdminTTSRequest(defaultRoom, data);
        });

        // Control the recievers video players
        socket.on("adminPlayerControl", function (data) {
            handlers.AdminPlayerControl(defaultRoom, data);
        });

        // Queue control
        socket.on("adminQueueControl", function (data) {
            return handlers.AdminQueueControl(defaultRoom, data);
        });

        // Manage the client's connections
        socket.on("adminConnectionManagement", function (control) {
            handlers.AdminConnectionManagement(defaultRoom, control);
        });

        // Remove client when they disconnect
        socket.on('disconnect', () => {
            handlers.Disconnect(defaultRoom, currentClient);
        });

        // socket.on('test', function (params) {
        //     var oof = new Date().getTime();

        //     function timeTest() {
        //         console.log("started");
        //         var oof2 = setTimeout(() => {
        //             console.log("OFFFFFFFFFFFFFFFFFFFFFFFFFOOOFFFFFFFFFFFFFFFFFFFFF" + ((new Date().getTime()) - oof));
        //         }, 213301);
        //     }

        //     timeTest();
        // });

    });
}

startServer();