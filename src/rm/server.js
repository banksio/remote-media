const socketio = require('socket.io');

// Classes
const server = require('../../web/js/classes');
const logging = require('./logging');
const handlers = require("./handlers");

//get socketio to listen to the webserver's connection
//Create a callback function to deal with each connection.
//The callback contains code to setup what happens whenever a named message is received
module.exports.start = function startServer(expressServer, cb) {
    var socketIOServer = socketio.listen(expressServer, { log: false });
    //create blank logins array
    var defaultRoom = new server.Room(socketIOServer);

    defaultRoom.io.on('connection', function (socket) {
        // A new connection from a client

        // Create a new Login object with the new socket's ID and add to the room
        var currentClient = handlers.clientConnect(defaultRoom, socket);

        // The receiver's player has loaded
        socket.on("receiverPlayerReady", function () {
            handlers.ReceiverPlayerReady(defaultRoom, currentClient);
        });

        // Acknowledge the receiver's nickname and let them know if it's valid or not
        socket.on('receiverNickname', (nick, fn) => {
            handlers.ReceiverNickname(defaultRoom, currentClient, nick, fn);
        });

        // The client has finished preloading
        socket.on("receiverPlayerPreloadingFinished", function (videoID) {
            handlers.ReceiverPreloadingFinished(defaultRoom, currentClient, videoID);
        });

        // Status of the receiver
        socket.on("receiverPlayerStatus", function (data) {
            handlers.ReceiverPlayerStatus(defaultRoom, currentClient, data);
        });

        // Recieved video details from a receiver
        socket.on("receiverVideoDetails", function (videoDetails) {
            handlers.ReceiverVideoDetails(defaultRoom, currentClient, videoDetails);
        });

        // The receiver has requested a timestamp
        socket.on('receiverTimestampRequest', (data, fn) => {
            handlers.ReceiverTimestampRequest(defaultRoom, currentClient, data, fn);
        });

        socket.on("receiverTimestampSyncRequest", (data, fn) => {
            handlers.ReceiverTimestampSyncRequest(defaultRoom, data, fn);
        });


        // All admin panel stuff //

        // Get new video and send to receivers
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

        // Control the receivers video players
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
            handlers.clientDisconnect(defaultRoom, currentClient);
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

    defaultRoom.onRoomEvent(handlers.onRoomEvent);

    defaultRoom.onClientEvent(handlers.onClientEvent);

    if (cb) return cb(socketIOServer);
    return socketIOServer;
}