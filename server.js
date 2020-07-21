// Include dependencies
const socketio = require('socket.io');
const express = require('express');
const path = require('path');
const ytlist = require('youtube-playlist');
const chalk = require('chalk');

// Classes
var server = require('./web/classes');
var rmUtils = require('./rmUtilities');
const { Video } = require('./web/classes');
const { Server } = require('http');
const rmUtilities = require('./rmUtilities');

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
    let now = new Date();
    let year = new Intl.DateTimeFormat('en', { year: '2-digit' }).format(now);
    let month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(now);
    let day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(now);
    console.log("[" + day + "/" + month + "/" + year + "]" + "[" + ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "] " + msg);
}

function prettyPrintClientID(client) {
    return (client.id + " (" + client.name + ")");
}

consoleLogWithTime("[INFO] Starting server...");

consoleLogWithTime("[INFO] Starting express...");
//create express object
var exp = express();

// Serve the reciever
exp.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/index.html'));
});

// Serve the admin panel
exp.get('/admin', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/admin.html'));
});

// Serve css
exp.get('/stylesheets/fa.css', function (req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/@fortawesome/fontawesome-free/css/all.css'));
});

// Serve socket.io
exp.get('/js/socket.io.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/socket.io-client/dist/socket.io.js'));
});

// Serve socket.io
exp.get('/js/socket.io.js.map', function (req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/socket.io-client/dist/socket.io.js.map'));
});

// Serve bootstrap and popper js
exp.get('/js/bootstrap.bundle.min.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'));
});

// Serve bootstrap and popper js
exp.get('/js/bootstrap.bundle.min.js.map', function (req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js.map'));
});

// Serve jQuery
exp.get('/js/jquery.slim.min.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/jquery/dist/jquery.slim.min.js'));
});

// Serve jQuery
exp.get('/js/jquery.slim.min.js.map', function (req, res) {
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
    sendQueueStatus(defaultRoom);
    if (defaultRoom.currentVideo.state == 1) sendNowPlaying(defaultRoom.currentVideo);
    socket.binary(false).emit('initFinished');

    consoleLogWithTime(chalk.green("[CliMgnt] New Client " + currentClient.id));

    // The reciever's player has loaded
    socket.on("recieverPlayerReady", function () {
        handleRecieverPlayerReady(socket, currentClient);
    });

    // Acknowledge the reciever's nickname and let them know if it's valid or not
    socket.on('receiverNickname', (nick, fn) => {
        handleRecieverNickname(socket, defaultRoom, currentClient, nick, fn);
    });

    // The client has finished preloading
    socket.on("recieverPlayerPreloadingFinished", function (videoID) {
        handleRecieverPreloadingFinished(socket, defaultRoom, currentClient, videoID);
    });

    // Status of the reciever
    socket.on("recieverPlayerStatus", function (data) {
        handleRecieverPlayerStatus(socket, defaultRoom, currentClient, data);
    });

    // Recieved video details from a reciever
    socket.on("recieverVideoDetails", function (videoDetails) {
        handleRecieverVideoDetails(socket, defaultRoom, currentClient, videoDetails);
    });

    // The reciever has requested a timestamp
    socket.on('recieverTimestampRequest', (fn) => {
        handleRecieverTimestampRequest(socket, defaultRoom, currentClient, fn);
    });

    socket.on("recieverTimestampSyncRequest", (timestamp) => {
        handleRecieverTimestampSyncRequest(socket, defaultRoom, timestamp);
    });


    // All admin panel stuff //

    // Get new video and send to recievers
    socket.on("adminNewVideo", function (data) {
        return handleAdminNewVideo(socket, defaultRoom, data);
    });

    socket.on("adminQueueAppend", function (data) {
        return handleAdminQueueAppend(socket, defaultRoom, data);
    });

    // Text to speech
    socket.on("adminTTSRequest", function (data) {
        handleAdminTTSRequest(socket, data);
    });

    // Control the recievers video players
    socket.on("adminPlayerControl", function (data) {
        handleAdminPlayerControl(socket, defaultRoom, data);
    });

    // Queue control
    socket.on("adminQueueControl", function (data) {
        return handleAdminQueueControl(socket, defaultRoom, data);
    });

    // Manage the client's connections
    socket.on("adminConnectionManagement", function (control) {
        handleAdminConnectionManagement(socket, defaultRoom, control);
    });

    // Remove client when they disconnect
    socket.on('disconnect', () => {
        handleDisconnect(socket, defaultRoom, currentClient);
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

function handleDisconnect(socket, room, client){
    console.log("[CliMgnt] " + prettyPrintClientID(client) + " has disconnected.");
    room.removeClient(client);
    broadcastClients(room);
    // Play the video if the server is waiting to start a video
    if (playIfPreloadingFinished(room) == 0) {
        return;  // Don't continue with this function
        // If the server is already playing a video
    }
}

function handleAdminConnectionManagement(socket, room, control) {
    consoleLogWithTime("Connection management request recieved");
    if (control == "reload") {
        io.binary(false).emit("serverConnectionManagement", "reload");
        consoleLogWithTime("[CliMgnt] Reloading all clients...");
    }
    else {
        io.binary(false).emit("serverConnectionManagement", "discon");
        consoleLogWithTime("[CliMgnt] Disconnecting all clients...");
    }
}

function handleAdminQueueControl(socket, room, data) {
    switch (data) {
        case "prev":
            playPrevInQueue(room);
            break;
        case "skip":
            playNextInQueue(room);
            break;
        case "empty":
            consoleLogWithTime("[ServerQueue] Emptying playlist");
            room.queue.empty();
            break;
        case "toggleShuffle":
            queueShuffleToggle(room);
            consoleLogWithTime("[ServerQueue] Shuffle: " + room.queue.shuffle);
            sendQueueStatus(room);
            sendQueue(room);
            return;
        default:
            break;
    }
    sendQueue(defauroomltRoom);
}

function handleAdminPlayerControl(socket, room, data) {
    if (data == "pause") {
        room.currentVideo.pauseVideo(false);
    }
    else if (data == "play") {
        room.currentVideo.playVideo();
    }
    consoleLogWithTime("[VideoControl] Video Control: " + data);
}

function handleAdminTTSRequest(socket, data) {
    io.binary(false).emit("serverTTSSpeak", data.value);
}

function handleAdminQueueAppend(socket, room, data) {
    defaultRoom.queue.addVideosCombo(data.value);
    sendQueue(defaultRoom);
    // playNextInQueue(defaultRoom);
    return;
}

function handleAdminNewVideo(socket, room, data) {
    var inputData = data.value;
    var urlArray = inputData.split(',');
    // If there's only one URL
    if (urlArray.length == 1) {
        let newVideo = new server.Video();
        newVideo.setIDFromURL(urlArray[0]);
        preloadNewVideoInRoom(newVideo, room);
    }
    return;
}

function handleRecieverPlayerStatus(socket, room, client, data) {
    // If the socket's not initialised, skip it
    if (socket.id == undefined) {
        return;
    }

    // If the client's on the wrong video, ignore this interaction
    if (data.videoID != room.currentVideo.id) {
        consoleLogWithTime(chalk.yellow("[Reciever Status] Recieved status from " + prettyPrintClientID(client) + " but wrong video."));
    }

    // Don't crash out if we can't get the current timestamp
    try {
        consoleLogWithTime("[Server Video] The current video timestamp is " + room.currentVideo.getElapsedTime());
    } catch (error) {
        console.error(error);
    }

    // Get the current state and use for logic
    let previousStatusState = client.status.state;

    console.log(JSON.stringify(data));
    // Save the state and the preloading state, send to clients
    let state = data.data.state;

    let preloading = data.data.preloading;

    client.status.updateState(state);
    client.status.updatePreloading(preloading);

    broadcastClients(room);
    consoleLogWithTime("[CliStatus] " + prettyPrintClientID(client) + " has new status:" + " status: " + state + " preloading:" + preloading);

    // If the client is preloading
    if (preloading == true) {
        return;  // Don't continue with this function
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
    // if (status.state == 3 && defaultRoom.allPreloaded()) {
    //     // Add the socket to the array and pause all the clients
    //     buffering.push(socket.id);
    //     // sendPlayerControl("pause");
    //     defaultRoom.currentVideo.pauseVideo(true);
    //     // defaultRoom.currentVideo.state = 3;
    //     consoleLogWithTime("[BufferMgnt] " + prettyPrintClientID(currentClient) + " is buffering. The video has been paused.");
    // // If client is playing
    // } else if (status.state == 1) {
    //     // If anyone was previously listed as buffering
    //     if (buffering.length > 0) {
    //         // Remove this client from the buffering array, they're ready
    //         consoleLogWithTime("[BufferMgnt] " + prettyPrintClientID(currentClient) + " has stopped buffering.");
    //         buffering.splice(buffering.indexOf(socket.id), 1);
    //         // If that means no one is buffering now, resume everyone
    //         if (buffering.length == 0) {
    //             consoleLogWithTime("[BufferMgnt] No one is buffering, resuming the video.");
    //             // sendPlayerControl("play");  // Play all the recievers
    //             defaultRoom.currentVideo.playVideo();
    //             // defaultRoom.currentVideo.state = 1;  // Tell the server the video's now playing again
    //         }
    //     }
    // }

    // if (previousStatusState == 3 && status.state != 3){
    //     broadcastBufferingClients(defaultRoom);
    // }

    // If the server has a video playing, client has finished playing and the queue is not empty
    // Status == 1 prevents the server getting confused when multiple clients respond
    // if (defaultRoom.currentVideo.state == 1 && status.state == 0 && defaultRoom.queue.length > 0) {
    //     consoleLogWithTime("[ServerQueue] " + prettyPrintClientID(currentClient) + " has finished. Playing the next video.");
    //     playNextInQueue(defaultRoom);
    // }
    broadcastBufferingIfClientNowReady(room, client.status);
    // TODO: Buffer pausing
}

function handleRecieverVideoDetails(socket, room, client, videoDetails) {
    if (videoDetails.id != room.currentVideo.id) {
        consoleLogWithTime("[ServerVideo] Recieved invalid video details from " + prettyPrintClientID(client));
        return;
    }
    consoleLogWithTime("[ServerVideo] Recieved video details from " + prettyPrintClientID(client));
    room.currentVideo.title = videoDetails.title;
    room.currentVideo.channel = videoDetails.channel;
    room.currentVideo.duration = videoDetails.duration;
    consoleLogWithTime("The video duration is " + videoDetails.duration);
    sendNowPlaying(room.currentVideo);
}

function handleRecieverTimestampSyncRequest(socket, room, timestamp) {
    room.currentVideo.timestamp = timestamp;
    broadcastTimestamp(timestamp);
}

function handleRecieverTimestampRequest(socket, room, client, callback) {
    console.log("[CliMgnt] " + prettyPrintClientID(client) + " has requested a timestamp.");
    callback(room.currentVideo.getElapsedTime());
}

function handleRecieverPlayerReady(socket, client) {
    consoleLogWithTime("[CliMgnt] " + prettyPrintClientID(client) + " is ready. ");
    // Update the state in our server
    client.status.playerLoading = false;
    client.status.state = -1;
    // Is there currently a video playing on the server?
    // If there is, we should send it to the newly created client.
    sendCurrentVideoToClient(socket, client);
    return 0;

}

function handleRecieverNickname(socket, room, client, nick, fn) {
    // TODO: Check for any other clients with the same nickname and return the error
    // Set the nickname
    // Instead of this, use new function from rmUtils
    console.log(nick);
    client.name = nick;
    // Upadte clients for admin panels
    broadcastClients(room);
    consoleLogWithTime("[CliNick] " + prettyPrintClientID(client) + " has set their nickname.");
    // Empty response is success, tells reciever to continue
    fn();
}

function handleRecieverPreloadingFinished(socket, room, client, videoID) {
    // Ignore if it's the wrong video
    if (rmUtilities.validateClientVideo(videoID, room)) {
        consoleLogWithTime(chalk.yellow("[ClientVideo] " + prettyPrintClientID(client) + " has finished preloading, but is on the wrong video."));
        return 1;  // Code 1: wrong video
    }

    client.status.updatePreloading(false);
    consoleLogWithTime("[ClientVideo] " + prettyPrintClientID(client) + " has finished preloading.");

    // Play the video if the server is waiting to start a video and this was the last client we were waiting for
    if (playIfPreloadingFinished(room) == 0) {
        return 0; // Don't continue with this function
        // If the server is already playing a video
    }
    else if (sendTimestampIfClientRequires(client, room, socket) == 0) {
        return 0;
    }
    return 0;
}

function sendCurrentVideoToClient(socket, currentClient) {
    if (defaultRoom.currentVideo.state != 0) {
        // There is a video playing, so the client will need to preload it and then go to the timestamp
        preloadVideoIndividualClient(defaultRoom.currentVideo, socket);
        // This client needs a timestamp ASAP, this should be picked up by the status checking function
        currentClient.status.requiresTimestamp = true;
        return 0;
    } else {
        return 1;
    }
}

function sendTimestampIfClientRequires(client, room, socket) {
    if (room.currentVideo.state != 0 && client.status.requiresTimestamp) {
        // We'll send the client a timestamp so it can sync with the server
        client.status.requiresTimestamp = false;
        consoleLogWithTime("[ClientVideo] " + prettyPrintClientID(client) + " requires a timestamp. Sending one to it now.");
        console.log("[CliMgnt] " + prettyPrintClientID(client) + " has been sent a timestamp.");
        try {
            sendIndividualTimestamp(socket, room.currentVideo.getElapsedTime());
        } catch (error) {
            console.error(error);
        }

    } else {
        return 1;  // The client doesn't need a timestamp
    }
    return 0;  // Don't continue with this function
}

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
    room.currentVideo = new server.ServerVideo();
    Object.assign(room.currentVideo, videoObj);
    room.currentVideo.onPlayDelay(checkVideoStartDelay);
    room.currentVideo.state = 5;
    room.currentVideo.onStateChange(function (state) {
        console.log("[ServerVideo] State " + state);
        switch (state) {
            case 1:
                sendPlayerControl("play");

                break;
            case 2:

            // break; Fall through
            case 3:
                sendPlayerControl("pause");
                break;
            case 5:

                break;
            default:
                break;
        }
    })
    room.currentVideo.whenFinished(function () {
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
    let queue = {
        videos: room.queue.videos,
        length: room.queue.length,
        index: room.queue._currentIndex
    };
    // console.log(queue);
    io.binary(false).emit("serverQueueVideos", queue);
}

function sendQueueStatus(room) {
    // Send the queue but remove the videos array, no need to send that
    let queueStatus = { shuffle: room.queue.shuffle };
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
    let nextVideo = room.queue.nextVideo();
    if (nextVideo != undefined) {
        preloadNewVideoInRoom(nextVideo, room);
        sendQueue(room);
    }
    return;
}

function playPrevInQueue(room) {
    let nextVideo = room.queue.previousVideo();
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
function checkVideoStartDelay(videoState) {
    consoleLogWithTime("Current video state is " + videoState);
    broadcastBufferingClients(defaultRoom);  // TODO: Refactor into generic room object
}

function broadcastBufferingClients(room) {
    let buffering = room.getBuffering();
    buffering.forEach(client => {
        consoleLogWithTime("Waiting on " + client.name + " with state " + client.status.state);
    });
    io.binary(false).emit("serverBufferingClients", buffering);
}

function broadcastBufferingIfClientNowReady(room, status) {
    // If the client is no longer 
    if (status.state < 3 && status.previousState >= 3) {
        broadcastBufferingClients(room);
    }
}


function playIfPreloadingFinished(room) {
    if (room.currentVideo.state == 5) {
        // If everyone's preloaded, play the video
        if (room.allPreloaded()) {
            if (room.currentVideo.duration == 0) {
                consoleLogWithTime("[Preload] Video details not recieved, cannot play video.");
                return 2;  // Error
            }
            // Set all the recievers playing
            // sendPlayerControl("play");
            consoleLogWithTime("[Preload] Everyone has finished preloading, playing the video " + room.allPreloaded());
            // Set the server's video instance playing
            room.currentVideo.playVideo();
            // room.currentVideo.state = 1;
            // room.currentVideo.startingTime = new Date().getTime();
        }
    } else {
        return 1;  // We're not trying to start a video, so don't continue with this function
    }
    return 0;  // We have started the video, all is good
}

// TODO: Write this function
function pauseClientsIfBuffering(status, client, room) {
    // If the client is buffering and no one's preloading,
    if (status.state == 3 && room.allPreloaded()) {
        // Add the socket to the array and pause all the clients
        // TODO: Let the room handle buffering, not the array
        // buffering.push(client.id); Should not be required, room should keep track of this
        // sendPlayerControl("pause");
        // room.currentVideo.pauseVideo(true);
        // room.currentVideo.state = 3;
        // consoleLogWithTime("[BufferMgnt] " + prettyPrintClientID(client) + " is buffering. The video has been paused.");
        return 3;
        // If client is playing
    } else if (status.state == 1) {
        // If anyone was previously listed as buffering
        // TODO: Let the room handle the buffering, not the array - may want to use callbacks
        // if (buffering.length > 0) {
        //     // Remove this client from the buffering array, they're ready
        //     consoleLogWithTime("[BufferMgnt] " + prettyPrintClientID(client) + " has stopped buffering.");
        //     buffering.splice(buffering.indexOf(client.id), 1);
        //     // If that means no one is buffering now, resume everyone
        //     if (buffering.length == 0) {
        //         consoleLogWithTime("[BufferMgnt] No one is buffering, resuming the video.");
        //         // sendPlayerControl("play");  // Play all the recievers
        //         room.currentVideo.playVideo();
        //         // defaultRoom.currentVideo.state = 1;  // Tell the server the video's now playing again
        //     }
        // }
        return 1;
    }
}

// defaultRoom.AnyClientStateChange()

function StateChangeHandler(room) {
    console.log("OOFOFOOFOFOFOFOFOFO");
    if (room.getBuffering().length == 0) {
        console.log("No one's buffering");
    } else {
        console.log("Someone could be buffering");
    }
}