// Include dependencies
const socketio = require('socket.io');
const express = require('express');
const ytlist = require('youtube-playlist');

// Classes
var server = require('./web/classes');

// Constants 
const port = 3694;
const allEqual = arr => arr.every(v => v === arr[0]);

//create blank logins array
var logins = {};
var targ = "pE49WK-oNjU";
var anyPreloading = false;
var buffering = [];
var queue = [];
var playlistShuffle = true;
var defaultRoom = new server.Room();

//function to provide well formatted date for console messages
function consoleLogWithTime(msg){
    console.log("["+new Date().getHours()+":"+new Date().getMinutes()+":"+new Date().getSeconds()+"]"+msg);
}
consoleLogWithTime("[INFO] Starting server...");

consoleLogWithTime("[INFO] Starting express...");
//create express object
var exp = express();
//use it to serve pages from the web folder
exp.use(express.static('web'));
var web = exp.listen(port);
 
//get socketio to listen to the webserver's connection
var io = socketio.listen(web, { log: false });
//Create a callback function to deal with each connection.
//The callback contains code to setup what happens whenever a named message is received
io.on('connection', function (socket) {
    //a new connection has been created i.e. a web browser has connected to the server

    // Create a new Login object with the new socket's ID and add to the room
    defaultRoom.addClient(new server.Login(socket.id, "new"));
    var currentClient = defaultRoom.clients[socket.id];

    // Send all data to new clients and admin panels
    sendQueue(defaultRoom);
    sendClients(defaultRoom);
    sendNowPlaying(defaultRoom.currentVideo);

    socket.emit('initFinished');

    consoleLogWithTime("New Client " + currentClient.id);

    socket.on("receiverNickname", function(name) {
        currentClient.name = name;
        sendClients(defaultRoom);
    });

    // Get new video and send to recievers
    socket.on("adminNewVideo", function (data) {
        var inputData = data.value;
        if (true) {
            // Split the CSV
            var urlArray = inputData.split(',');
            // If there's only one URL
            if (urlArray.length == 1) {
                var newVideo = new server.Video();
                newVideo.setIDFromURL(urlArray[0]);
                playVideo(newVideo);
                defaultRoom.currentVideo = newVideo;
                defaultRoom.currentVideo.state = 3;
                return;
            }
            // If there's multiple URLs
            defaultRoom.queue.addVideosFromURLs(inputData);
            sendQueue(defaultRoom);
            return;
        }
    });
    
    // Text to speech
    socket.on("adminTTSRequest", function (data) {
        if (true) {
            io.emit("serverTTSSpeak", data.value);
        }
    });

    // Control the recievers video players
    socket.on("adminPlayerControl", function (data) {
        sendPlayerControl(data);
        consoleLogWithTime("Video Control: " + data);
    });

    // Queue control
    socket.on("adminQueueControl", function (data) {
        switch (data) {
            case "prev":
                
                break;
            case "skip":
                playNextInQueue(defaultRoom);
                break;
            case "empty":
                consoleLogWithTime("Emptying playlist");
                defaultRoom.queue.empty();
                break;
            case "toggleShuffle":
                queueShuffleToggle(defaultRoom);
                consoleLogWithTime("Shuffle: " + defaultRoom.queue.shuffle);
                sendQueueStatus(defaultRoom);
                return;
            default:
                break;
        }
        sendQueue(defaultRoom);
    });
    
    // Status of the reciever
    socket.on("recieverPlayerStatus", function(status){
        // If the socket's not initialised, skip it
        if (socket.id == undefined) {
            return;
        }

        // Save the state and the preloading stage
        var state = status.state;
        var preloading = status.preloading;
        // console.log(defaultRoom.allPreloaded());
        // There'll be no state yet if the client hasn't yet recieved a video
        if (state == undefined) {
            // Update the preloading status of the currentClient variable
            currentClient.status.updatePreloading(preloading);
            if (preloading) {
                anyPreloading = true;
            }
            // consoleLogWithTime(data)
            consoleLogWithTime(defaultRoom.clients);
            // If everyone's preloaded, wait a millisecond then set the variable (not sure why the wait is here)
            if (defaultRoom.allPreloaded()) {
                setTimeout(() => {
                    anyPreloading = false;
                }, 1);
                sendPlayerControl("play");
                // Set the server's video instance playing
                defaultRoom.currentVideo.state = 1;
                defaultRoom.currentVideo.startingTime = new Date().getTime();
            }
            return;
        }
        // If there is a defined state,

        // Update the status of the current client
        currentClient.status.updateStatus(status);

        consoleLogWithTime("debug:PLAYER" + socket.id + " status: " + status.state);
        // If anyone buffers (no one's preloading),
        if (anyPreloading == false && status.state == 3) {
            // Add the socket to the array and pause
            buffering.push(socket.id);
            sendPlayerControl("pause");
            consoleLogWithTime("pausing cause buffer");
            consoleLogWithTime(status.state);
        // If they're playing
        } else if (status.state == 1) {
            // If anyone is buffering
            if (buffering.length > 0) {
                // Remove this client from the buffering array, they're ready
                // consoleLogWithTime(status.state);
                buffering.splice(buffering.indexOf(socket.id), 1);
                if (buffering.length == 0) {
                    consoleLogWithTime("resuming");
                    sendPlayerControl("play");
                }
            }
        }
        if (status.state == 0 && defaultRoom.queue.length > 0) {
            let nextVideo = defaultRoom.queue.popVideo();
            playVideo(nextVideo);
            defaultRoom.currentVideo = nextVideo;
        }

        sendClients(defaultRoom);
    });

    // Recieved video details from a reciever
    socket.on("recieverVideoDetails", function(videoDetails){
        if (videoDetails.id != defaultRoom.currentVideo.id){
            consoleLogWithTime("Recieved invalid video details from " + currentClient.name);
            return;
        }
        consoleLogWithTime("Recieved video details from " + currentClient.name);
        defaultRoom.currentVideo.title = videoDetails.title;
        defaultRoom.currentVideo.channel = videoDetails.channel;
        sendNowPlaying(defaultRoom.currentVideo);
    });

    socket.on("recieverRequestNowPlaying", function(){
        sendNowPlaying(defaultRoom.currentVideo);
    });

    // Remove client when they disconnect
    socket.on('disconnect', () => {
        console.log("disconnected");
        defaultRoom.removeClient(currentClient);
        sendClients(defaultRoom);
    });
    
    // Manage the client's connections
    socket.on("adminConnectionManagement", function (control) {
        consoleLogWithTime("Connection management request recieved");
        if (control == "reload") {
            io.emit("serverConnectionManagement", "reload");
            consoleLogWithTime("Reloading all clients...");
        } else {
            io.emit("serverConnectionManagement", "discon");
            consoleLogWithTime("Disconnecting all clients...");
        }
    });
 
});

// Refactored
function playVideo(video){
    var newID = {"value": video.id};
    consoleLogWithTime("New Video ID sent: "+newID.value);
    io.emit("serverNewVideo",newID);
    return;
}

function sendQueue(room){
    // Send the whole queue
    var queue = room.queue;
    io.emit("serverQueueVideos", queue);
}

function sendQueueStatus(room){
    // Send the queue but remove the videos array, no need to send that
    var queueStatus = room.queue;
    // queueStatus.videos = undefined;
    io.emit("serverQueueStatus", queueStatus);
}

function sendNowPlaying(video){
    // Update elapsed time
    video.getElapsedTime(new Date().getTime());
    // Send the current video object to all clients (and admin panels)
    io.emit("serverCurrentVideo", video);
}

function queueShuffleToggle(room){
    var queue = room.queue;
    queue.shuffle = !queue.shuffle;
    return queue.shuffle;
}

function sendPlayerControl(control){
    io.emit("serverPlayerControl",control);
}

function sendClients(room){
    var clients = room.clients;
    io.emit("serverClients", clients);
}

function playNextInQueue(room){
    var nextVideo = defaultRoom.queue.popVideo();
    if (nextVideo != undefined){
        playVideo(nextVideo);
        sendQueue(room);
    }
    return;
}