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
        var currentClient = handlers.newClient(defaultRoom, socket);

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

    if (cb) return cb(socketIOServer);
    return socketIOServer;
}