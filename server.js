// Include dependencies
const socketio = require('socket.io');
const express = require('express');
const path = require('path');
const ytlist = require('youtube-playlist');

// Classes
var server = require('./web/classes');
var rmUtils = require('./rmUtilities');
const { Video } = require('./web/classes');

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
    let now = new Date();
    let year = new Intl.DateTimeFormat('en', { year: '2-digit' }).format(now);
    let month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(now);
    let day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(now);
    console.log("["+day+"/"+month+"/"+year+"]"+"["+('0' + now.getHours()).slice(-2)+":"+('0' + now.getMinutes()).slice(-2)+":"+('0' + now.getSeconds()).slice(-2)+"] "+msg);
}

function prettyPrintClientID(client){
    return (client.id + " (" + client.name + ")");
}

consoleLogWithTime("[INFO] Starting server...");

consoleLogWithTime("[INFO] Starting express...");
//create express object
var exp = express();

// Serve the reciever
exp.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/index.html'));
});

// Serve the admin panel
exp.get('/admin', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/admin.html'));
});

// Serve css
exp.get('/stylesheets/fa.css', function(req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/@fortawesome/fontawesome-free/css/all.css'));
});

// Serve socket.io
exp.get('/js/socket.io.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/socket.io-client/dist/socket.io.js'));
});

// Serve socket.io
exp.get('/js/socket.io.js.map', function(req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/socket.io-client/dist/socket.io.js.map'));
});

// Serve bootstrap and popper js
exp.get('/js/bootstrap.bundle.min.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'));
});

// Serve bootstrap and popper js
exp.get('/js/bootstrap.bundle.min.js.map', function(req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js.map'));
});

// Serve jQuery
exp.get('/js/jquery.slim.min.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/jquery/dist/jquery.slim.min.js'));
});

// Serve jQuery
exp.get('/js/jquery.slim.min.js.map', function(req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/jquery/dist/jquery.slim.min.js.map'));
});

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
    if (defaultRoom.currentVideo.state == 1) sendNowPlaying(defaultRoom.currentVideo);
    socket.binary(false).emit('initFinished');

    consoleLogWithTime("[CliMgnt] New Client " + currentClient.id);

    // The reciever's player has loaded
    socket.on("recieverPlayerReady", function () {
        consoleLogWithTime("[CliMgnt] " + prettyPrintClientID(currentClient) + " is ready. ");
        // Update the state in our server
        currentClient.status.playerLoading = false;
        // Is there currently a video playing on the server?
        // If there is, we should send it to the newly created client.
        if (defaultRoom.currentVideo.state == 1) {
            // There is a video playing, so the client will need to preload it and then go to the timestamp
            preloadVideoIndividualClient(defaultRoom.currentVideo, socket);
            // This client needs a timestamp ASAP, this should be picked up by the status checking function
            currentClient.status.requiresTimestamp = true;
        }
    });

    // Replaced with code beneath
    // socket.on("receiverNickname", function (name) {
    //     currentClient.name = name;
    //     broadcastClients(defaultRoom);
    // });

    // Acknowledge the reciever's nickname and let them know if it's valid or not
    socket.on('receiverNickname', (nick, fn) => {
        // TODO: Check for any other clients with the same nickname and return the error
        // Set the nickname
        // Instead of this, use new function from rmUtils
        currentClient.name = nick;
        // Upadte clients for admin panels
        broadcastClients(defaultRoom);
        consoleLogWithTime("[CliNick] " + prettyPrintClientID(currentClient) + " has set their nickname.");
        // Empty response is success, tells reciever to continue
        fn();
    });

    // Status of the reciever
    socket.on("recieverPlayerStatus", function (status) {
        // If the socket's not initialised, skip it
        if (socket.id == undefined) {
            return;
        }
        consoleLogWithTime("[Server Video] The current video timestamp is " + defaultRoom.currentVideo.getElapsedTime());
        // Get the current state and use for logic
        let previousPreloadingState = currentClient.status.preloading;
        // Save the state and the preloading state, send to clients
        let state = status.state;
        let preloading = status.preloading;
        currentClient.status.updateState(state);
        currentClient.status.updatePreloading(preloading);
        broadcastClients(defaultRoom);
        consoleLogWithTime("[CliStatus] " + prettyPrintClientID(currentClient) + " has new status:" + " status: " + state + " preloading:" + preloading);

        // If the client is preloading
        if (preloading == true){
            return;  // Don't continue with this function
        // If the client has just finished preloading
        } else if (preloading == false && previousPreloadingState == true) {
            // If the server is waiting to start a video
            if (defaultRoom.currentVideo.state == 5) {
                // If everyone's preloaded, play the video
                if (defaultRoom.allPreloaded()) {
                    if (defaultRoom.currentVideo.duration == 0){
                        consoleLogWithTime("[Preload] Video details not recieved, cannot play video.");
                        return;
                    }
                    // Set all the recievers playing
                    sendPlayerControl("play");
                    consoleLogWithTime("[Preload] Everyone has finished preloading, playing the video " + defaultRoom.allPreloaded());
                    // Set the server's video instance playing
                    defaultRoom.currentVideo.state = 1;
                    // defaultRoom.currentVideo.startingTime = new Date().getTime();
                }
                return;  // Don't continue with this function
            // If the server is already playing a video
            } else if (defaultRoom.currentVideo.state == 1 && currentClient.status.requiresTimestamp) {
                // We'll send the client a timestamp so it can sync with the server
                currentClient.status.requiresTimestamp = false;
                consoleLogWithTime("[ClientVideo] " + prettyPrintClientID(currentClient) + " requires a timestamp. Sending one to it now.");
                console.log("[CliMgnt] " + prettyPrintClientID(currentClient) + " has been sent a timestamp.");
                sendIndividualTimestamp(socket, defaultRoom.currentVideo.getElapsedTime());
                return;  // Don't continue with this function
            }
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
        if (status.state == 3 && defaultRoom.allPreloaded()) {
            // Add the socket to the array and pause all the clients
            buffering.push(socket.id);
            sendPlayerControl("pause");
            defaultRoom.currentVideo.state = 3;
            consoleLogWithTime("[BufferMgnt] " + prettyPrintClientID(currentClient) + " is buffering. The video has been paused.");
        // If client is playing
        } else if (status.state == 1) {
            // If anyone was previously listed as buffering
            if (buffering.length > 0) {
                // Remove this client from the buffering array, they're ready
                consoleLogWithTime("[BufferMgnt] " + prettyPrintClientID(currentClient) + " has stopped buffering.");
                buffering.splice(buffering.indexOf(socket.id), 1);
                // If that means no one is buffering now, resume everyone
                if (buffering.length == 0) {
                    consoleLogWithTime("[BufferMgnt] No one is buffering, resuming the video.");
                    sendPlayerControl("play");  // Play all the recievers
                    defaultRoom.currentVideo.state = 1;  // Tell the server the video's now playing again
                }
            }
        }

        // If the server has a video playing, client has finished playing and the queue is not empty
        // Status == 1 prevents the server getting confused when multiple clients respond
        // if (defaultRoom.currentVideo.state == 1 && status.state == 0 && defaultRoom.queue.length > 0) {
        //     consoleLogWithTime("[ServerQueue] " + prettyPrintClientID(currentClient) + " has finished. Playing the next video.");
        //     playNextInQueue(defaultRoom);
        // }
    });

    // Recieved video details from a reciever
    socket.on("recieverVideoDetails", function (videoDetails) {
        if (videoDetails.id != defaultRoom.currentVideo.id) {
            consoleLogWithTime("[ServerVideo] Recieved invalid video details from " + prettyPrintClientID(currentClient));
            return;
        }
        consoleLogWithTime("[ServerVideo] Recieved video details from " + prettyPrintClientID(currentClient));
        defaultRoom.currentVideo.title = videoDetails.title;
        defaultRoom.currentVideo.channel = videoDetails.channel;
        defaultRoom.currentVideo.duration = videoDetails.duration;
        consoleLogWithTime("The video duration is " + videoDetails.duration);
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
        console.log("[CliMgnt] " + prettyPrintClientID(currentClient) + " has requested a timestamp.");
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
        var urlArray = inputData.split(',');
        // If there's only one URL
        if (urlArray.length == 1) {
            let newVideo = new server.Video();
            newVideo.setIDFromURL(urlArray[0]);
            preloadNewVideoInRoom(newVideo, defaultRoom);
        }
        return;
    });

    socket.on("adminQueueAppend", function (data) {
        console.log(data);
        var inputData = data.value;
        // If we've got a playlist JSON on our hands
        if (inputData.substring(0, 8) == "RMPLYLST"){
            let playlistJSON = JSON.parse(inputData.substring(8));
            for (let [url, details] of Object.entries(playlistJSON)) {
                let newVideo = new Video(undefined, details.title, details.channel);
                newVideo.setIDFromURL(url);
                defaultRoom.queue.addVideo(newVideo);
            }
            sendQueue(defaultRoom);
            playNextInQueue(defaultRoom);
            return;
        // If not, it'll probably be a CSV or single video
        } else {
            // Split the CSV
            var urlArray = inputData.split(',');
            // If there's only one URL, add that
            if (urlArray.length == 1) {
                let newVideo = new server.Video();
                newVideo.setIDFromURL(urlArray[0]);
                defaultRoom.queue.addVideo(newVideo);
            // If there's multiple URLs, pass the CSV to the handling function
            } else if (urlArray.length >= 1){
                defaultRoom.queue.addVideosFromURLs(inputData);
            }
        }
        sendQueue(defaultRoom);
        playNextInQueue(defaultRoom);
        return;
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
        consoleLogWithTime("[VideoControl] Video Control: " + data);
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
                consoleLogWithTime("[ServerQueue] Emptying playlist");
                defaultRoom.queue.empty();
                break;
            case "toggleShuffle":
                queueShuffleToggle(defaultRoom);
                consoleLogWithTime("[ServerQueue] Shuffle: " + defaultRoom.queue.shuffle);
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
            consoleLogWithTime("[CliMgnt] Reloading all clients...");
        } else {
            io.binary(false).emit("serverConnectionManagement", "discon");
            consoleLogWithTime("[CliMgnt] Disconnecting all clients...");
        }
    });

    // Remove client when they disconnect
    socket.on('disconnect', () => {
        console.log("[CliMgnt] " + prettyPrintClientID(currentClient) + " has disconnected.");
        defaultRoom.removeClient(currentClient);
        broadcastClients(defaultRoom);
    });

    socket.on('test', function (params) {
        var oof = new Date().getTime();

        function timeTest(){
            console.log("started");
            var oof2 = setTimeout(() => {
                console.log("OFFFFFFFFFFFFFFFFFFFFFFFFFOOOFFFFFFFFFFFFFFFFFFFFF" + ((new Date().getTime()) - oof));
            }, 213301);
        }

        timeTest();
    });

});


// Refactored

// Send timestamp to a client
function sendIndividualTimestamp(socket, timestamp) {
    socket.binary(false).emit("serverVideoTimestamp", timestamp);
}

// Send timestamp to all clients
function broadcastTimestamp(timestamp) {
    io.binary(false).emit("serverVideoTimestamp", timestamp);
}

// Set a new video playing on the server
function preloadNewVideoInRoom(videoObj, room) {
    broadcastPreloadVideo(videoObj);
    room.currentVideo = videoObj;
    room.currentVideo.cbStateDelay = checkVideoStartDelay;
    room.currentVideo.state = 5;
    room.currentVideo.whenFinished(function() {
        // Video has finished.
        
        consoleLogWithTime("[ServerVideo] The video has finished. Elapsed time: " + room.currentVideo.getElapsedTime());
        playNextInQueue(room);
    });
}

function broadcastPreloadVideo(videoObj) {
    let newID = { "value": videoObj.id };
    consoleLogWithTime("New Video ID sent: " + newID.value);
    io.binary(false).emit("serverNewVideo", newID);
    return;
}

function preloadVideoIndividualClient(videoObj, socket) {
    let newID = { "value": videoObj.id };
    consoleLogWithTime("New Video ID sent to client " + socket.id + ": " + newID.value);
    socket.binary(false).emit("serverNewVideo", newID);
    return;
}

function sendQueue(room) {
    // Send the whole queue
    let queue = room.queue;
    io.binary(false).emit("serverQueueVideos", queue);
}

function sendQueueStatus(room) {
    // Send the queue but remove the videos array, no need to send that
    let queueStatus = room.queue;
    // queueStatus.videos = undefined;
    io.binary(false).emit("serverQueueStatus", queueStatus);
}

function sendNowPlaying(video) {
    // Update elapsed time
    // video.getElapsedTime(new Date().getTime());  // UPDATE no longer used
    // Send the current video object to all clients (and admin panels)
    // console.log(video);
    io.binary(false).emit("serverCurrentVideo", JSON.stringify(video, video.cyclicReplacer));
}

function queueShuffleToggle(room) {
    let queue = room.queue;
    queue.shuffle = !queue.shuffle;
    return queue.shuffle;
}

function sendPlayerControl(control) {
    io.binary(false).emit("serverPlayerControl", control);
}

function broadcastClients(room) {
    let clients = room.clients;
    io.binary(false).emit("serverClients", clients);
}

function playNextInQueue(room) {
    let nextVideo = room.queue.popVideo();
    if (nextVideo != undefined) {
        preloadNewVideoInRoom(nextVideo, room);
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
    broadcastBufferingClients(defaultRoom);  // TODO: Refactor into generic room object
}

function broadcastBufferingClients(room){
    let buffering = room.getBuffering();
    buffering.forEach(client => {
        consoleLogWithTime("Waiting on " + client.name + " with state " + client.status.state);
    });
    io.binary(false).emit("serverBufferingClients", buffering);
}