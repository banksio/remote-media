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
function consoleLogWithTime(msg) {
    console.log("[" + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + "]" + msg);
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
    // A new connection from a client

    // Create a new Login object with the new socket's ID and add to the room
    defaultRoom.addClient(new server.Login(socket.id, socket.id));
    var currentClient = defaultRoom.clients[socket.id];

    // Send all data to new clients and admin panels
    sendQueue(defaultRoom);
    broadcastClients(defaultRoom);
    socket.binary(false).emit('initFinished');

    consoleLogWithTime("New Client " + currentClient.id);

    // The reciever's player has loaded
    socket.on("recieverPlayerReady", function () {
        console.log("RECIEVED READY " + currentClient.id);
        // Update the state in our server
        currentClient.status.playerLoading = false;
        // Is there currently a video playing on the server?
        // If there is, we should send it to the newly created client.
        if (defaultRoom.currentVideo.state == 1) {
            // There is a video playing, so the client will need to preload it and then go to the timestamp
            playVideoIndividualClient(defaultRoom.currentVideo, socket);
            // This client needs a timestamp ASAP, this should be picked up by the status checking function
            currentClient.status.requiresTimestamp = true;
        }
    });

    socket.on("receiverNickname", function (name) {
        currentClient.name = name;
        broadcastClients(defaultRoom);
    });

    // Status of the reciever
    socket.on("recieverPlayerStatus", function (status) {
        // If the socket's not initialised, skip it
        if (socket.id == undefined) {
            return;
        }

        // Save the state and the preloading state, send to clients
        let state = status.state;
        let preloading = status.preloading;
        currentClient.status.updateState(state);
        currentClient.status.updatePreloading(preloading);
        broadcastClients(defaultRoom);
        // consoleLogWithTime("New state recieved " + status.state);
        // consoleLogWithTime("New preloading recieved " + status.preloading);
        consoleLogWithTime("debug:PLAYER" + socket.id + " status: " + state + " preloading:" + preloading);

        if (preloading == false && defaultRoom.currentVideo.state == 5) {  // If this client is preloaded and the server is waiting to start a video
            // If everyone's preloaded, play the video
            if (defaultRoom.allPreloaded()) {
                // Set all the recievers playing
                sendPlayerControl("play");
                consoleLogWithTime("playing" + defaultRoom.allPreloaded());
                // Set the server's video instance playing
                defaultRoom.currentVideo.state = 1;

                // defaultRoom.currentVideo.startingTime = new Date().getTime();
            }
            return;  // Don't continue
        } else if (preloading == false && defaultRoom.currentVideo.state == 1 && currentClient.status.requiresTimestamp) {  // If this client is preloaded and the server is already playing a video
            currentClient.status.requiresTimestamp = false;
            console.log("GETTINGTIME");
            sendIndividualTimestamp(socket, defaultRoom.currentVideo.getElapsedTime());
            return;  // Don't continue
        } else if (preloading == true) {  // If the client is currently preloading
            return;  // Don't continue
        }

        // There'll be no state yet if the client hasn't yet recieved a video
        // if (state == undefined) {
        //     // Update the preloading status of the currentClient variable
        //     // currentClient.status.updatePreloading(preloading);
        //     // if (preloading) {
        //     //     anyPreloading = true;
        //     // }
        //     // consoleLogWithTime(data)
        //     consoleLogWithTime(defaultRoom.clients);
        //     // If everyone's preloaded, wait a millisecond then set the variable (not sure why the wait is here)

        //     return;
        // }
        // If there is a defined state,

        // Update the status of the current client
        // currentClient.status.updateStatus(status);


        // If the client buffers and no one's preloading,
        if (defaultRoom.allPreloaded() && status.state == 3) {
            // Add the socket to the array and pause all the clients
            buffering.push(socket.id);
            sendPlayerControl("pause");
            defaultRoom.currentVideo.state = 3;
            consoleLogWithTime("pausing cause buffer");
            consoleLogWithTime(status.state);
            // If client is playing
        } else if (status.state == 1) {
            // If anyone was listed as buffering
            if (buffering.length > 0) {
                // Remove this client from the buffering array, they're ready
                // consoleLogWithTime(status.state);
                buffering.splice(buffering.indexOf(socket.id), 1);
                if (buffering.length == 0) {
                    consoleLogWithTime("resuming");
                    sendPlayerControl("play");  // Play all the recievers
                    defaultRoom.currentVideo.state = 1;  // Tell the server the video's now playing again
                }
            }
        }
        // If the client has finished playing and the queue is not empty
        if (status.state == 0 && defaultRoom.queue.length > 0) {
            let nextVideo = defaultRoom.queue.popVideo();
            playVideo(nextVideo);
            defaultRoom.currentVideo = nextVideo;
        }
    });

    // Recieved video details from a reciever
    socket.on("recieverVideoDetails", function (videoDetails) {
        if (videoDetails.id != defaultRoom.currentVideo.id) {
            consoleLogWithTime("Recieved invalid video details from " + currentClient.name);
            return;
        }
        consoleLogWithTime("Recieved video details from " + currentClient.name);
        defaultRoom.currentVideo.title = videoDetails.title;
        defaultRoom.currentVideo.channel = videoDetails.channel;
        sendNowPlaying(defaultRoom.currentVideo);
    });

    
    // socket.emit('pingTime', function () {
        
    // });

    // setInterval(() => {
    //     let ping = new Date().getTime();
    //     socket.volatile.emit('ferret', 'tobi', (data) => {
    //         currentClient.ping = (new Date().getTime() - ping);
    //     });
    //     console.log("PING OF CLIENT " + currentClient.id + " = " + currentClient.ping);
    // }, 1000);

    socket.on('recieverTimestampRequest', (fn) => {
        fn(defaultRoom.currentVideo.getElapsedTime());
    });

    socket.on("recieverTimestampSyncRequest", function (timestamp) {
        defaultRoom.currentVideo.timestamp = timestamp;
        broadcastTimestamp(timestamp);
    });

    // All admin panel stuff //
    ///////////////////////////

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
                defaultRoom.currentVideo.cbStateDelay = checkVideoStartDelay;
                defaultRoom.currentVideo.state = 5;
                // defaultRoom.currentVideo._stateCB = shout;
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
            io.binary(false).emit("serverTTSSpeak", data.value);
        }
    });

    // Control the recievers video players
    socket.on("adminPlayerControl", function (data) {
        sendPlayerControl(data);
        if (data == "pause") {
            defaultRoom.currentVideo.pauseTimer();
        } else if (data == "play") {
            defaultRoom.currentVideo.resumeTimer();
        }
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

    // Manage the client's connections
    socket.on("adminConnectionManagement", function (control) {
        consoleLogWithTime("Connection management request recieved");
        if (control == "reload") {
            io.binary(false).emit("serverConnectionManagement", "reload");
            consoleLogWithTime("Reloading all clients...");
        } else {
            io.binary(false).emit("serverConnectionManagement", "discon");
            consoleLogWithTime("Disconnecting all clients...");
        }
    });

    // Remove client when they disconnect
    socket.on('disconnect', () => {
        console.log("disconnected");
        defaultRoom.removeClient(currentClient);
        broadcastClients(defaultRoom);
    });

});

// Send timestamp to a client
function sendIndividualTimestamp(socket, timestamp) {
    socket.binary(false).emit("serverVideoTimestamp", timestamp);
}

// Send timestamp to all client
function broadcastTimestamp(timestamp) {
    io.binary(false).emit("serverVideoTimestamp", timestamp);
}

// Refactored
function playVideo(video) {
    var newID = { "value": video.id };
    consoleLogWithTime("New Video ID sent: " + newID.value);
    io.binary(false).emit("serverNewVideo", newID);
    return;
}

function playVideoIndividualClient(video, socket) {
    var newID = { "value": video.id };
    consoleLogWithTime("New Video ID sent to client " + socket.id + ": " + newID.value);
    socket.binary(false).emit("serverNewVideo", newID);
    return;
}

function sendQueue(room) {
    // Send the whole queue
    var queue = room.queue;
    io.binary(false).emit("serverQueueVideos", queue);
}

function sendQueueStatus(room) {
    // Send the queue but remove the videos array, no need to send that
    var queueStatus = room.queue;
    // queueStatus.videos = undefined;
    io.binary(false).emit("serverQueueStatus", queueStatus);
}

function sendNowPlaying(video) {
    // Update elapsed time
    // video.getElapsedTime(new Date().getTime());  // UPDATE no longer used
    // Send the current video object to all clients (and admin panels)
    io.binary(false).emit("serverCurrentVideo", video);
}

function queueShuffleToggle(room) {
    var queue = room.queue;
    queue.shuffle = !queue.shuffle;
    return queue.shuffle;
}

function sendPlayerControl(control) {
    io.binary(false).emit("serverPlayerControl", control);
}

function broadcastClients(room) {
    var clients = room.clients;
    io.binary(false).emit("serverClients", clients);
}

function playNextInQueue(room) {
    var nextVideo = defaultRoom.queue.popVideo();
    if (nextVideo != undefined) {
        playVideo(nextVideo);
        sendQueue(room);
    }
    return;
}

function shout(video) {
    console.log("OFFFFFFFFFFFFF");
}

// Called when the video does not start for two seconds
function checkVideoStartDelay(videoState){
    consoleLogWithTime("Current video state is " + videoState);
    let buffering = defaultRoom.getBuffering();
    buffering.forEach(client => {
        console.log("Waiting on " + client.name + " with state " + client.status.state);
    });
    io.binary(false).emit("serverBufferingClients", buffering);
}