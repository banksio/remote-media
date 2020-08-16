const chalk = require('chalk');
var server = require('../../web/js/classes');
const rmUtilities = require('./utils');
const logging = require('./logging');
const transmit = require('./socketTransmit');
const utils = require('./utils');
const { event } = require("../../web/js/event")

function clientConnect(room, socket) {
    // Call the newClient event to add a new client
    return room.events.newClient(socket)
}
module.exports.clientConnect = clientConnect;


function clientDisconnect(room, client) {
    // Call the newClient event to remove the client
    room.events.disconnectClient(client)
    return;
}
module.exports.clientDisconnect = clientDisconnect;


// Not a room event
function AdminConnectionManagement(room, control) {
    logging.withTime("Connection management request recieved.");
    switch (control) {
        case "reload":
            transmit.broadcastConnectionManagement(room, "reload");
            logging.withTime("[CliMgnt] Reloading all clients...");
            break;
        case "discon":
            transmit.broadcastConnectionManagement(room, "discon");
            logging.withTime("[CliMgnt] Disconnecting all clients...");
            break;
        default:
            break;
    }
}
module.exports.AdminConnectionManagement = AdminConnectionManagement;


function AdminQueueControl(room, data) {
    // Call the queueControl event to modify the queue
    room.events.queueControl(data);
}
module.exports.AdminQueueControl = AdminQueueControl;


function AdminPlayerControl(room, data) {
    // Call the videoControl event to change the state of the video
    room.events.videoControl(data);
}
module.exports.AdminPlayerControl = AdminPlayerControl;


function AdminTTSRequest(room, data) {
    room.io.binary(false).emit("serverTTSSpeak", data.value);
}
module.exports.AdminTTSRequest = AdminTTSRequest;


function AdminQueueAppend(room, data) {
    // Call queueAppend event to add videos to queue
    room.events.queueAppend(data.value);
    return;
}
module.exports.AdminQueueAppend = AdminQueueAppend;


function AdminNewVideo(room, data) {
    // Call the new video event to set a new video in the room
    room.events.newVideo(data.value);
    return;
}
module.exports.AdminNewVideo = AdminNewVideo;


function ReceiverPlayerStatus(room, client, data) {
    // Call the receiver player status room event
    room.events.receiverPlayerStatus(data, client);
}
module.exports.ReceiverPlayerStatus = ReceiverPlayerStatus;


function ReceiverVideoDetails(room, client, videoDetails) {
    // Call the video details event to assign the details of the video to the server
    room.events.receiverVideoDetails(videoDetails, client);
}
module.exports.ReceiverVideoDetails = ReceiverVideoDetails;


function ReceiverTimestampSyncRequest(room, timestamp) {
    // Call the newTimestamp event to set the video timestamp
    room.events.newTimestamp(timestamp);
}
module.exports.ReceiverTimestampSyncRequest = ReceiverTimestampSyncRequest;

// Not a room event
function ReceiverTimestampRequest(room, client, callback) {
    console.log("[CliMgnt] " + logging.prettyPrintClientID(client) + " has requested a timestamp.");
    callback(room.currentVideo.getElapsedTime());
}
module.exports.ReceiverTimestampRequest = ReceiverTimestampRequest;


function ReceiverPlayerReady(room, client) {
    // Call the receiver ready event to send the current video if there's one playing
    room.events.receiverReady(client);
}
module.exports.ReceiverPlayerReady = ReceiverPlayerReady;


function ReceiverNickname(room, client, nick, callback) {
    // Empty response is success, tells receiver to continue
    callback(room.events.receiverNickname(nick, client));
}
module.exports.ReceiverNickname = ReceiverNickname;


function ReceiverPreloadingFinished(room, client, videoID) {
    // Call the receiver preloading finished event
    room.events.receiverPreloadingFinished(videoID, client);
}
module.exports.ReceiverPreloadingFinished = ReceiverPreloadingFinished;

function onRoomEvent(eventObj, room) {
    // Pass event and data to transmit
    // Could have "onEvents" handler too, for multiple events
    transmit.broadcastEventObject(room.io, eventObj);
}
module.exports.onRoomEvent = onRoomEvent;

function onClientEvent(eventObj, room, client) {
    // Pass event and data to transmit
    // Could have "onEvents" handler too, for multiple events
    transmit.sendEventObject(room.io, client.id, eventObj);
}
module.exports.onClientEvent = onClientEvent;

function queueShuffleToggle(room) {
    let queue = room.queue;
    queue.shuffle = !queue.shuffle;
    return queue.shuffle;
}


function playNextInQueue(room) {
    let nextVideo = room.queue.nextVideo();
    if (nextVideo != undefined) {
        preloadNewVideoInRoom(nextVideo, room);
        transmit.broadcastQueue(room);
    }
    return;
}


function playPrevInQueue(room) {
    let nextVideo = room.queue.previousVideo();
    if (nextVideo != undefined) {
        preloadNewVideoInRoom(nextVideo, room);
        transmit.broadcastQueue(room);
    }
    return;
}


function shout(video) {
    console.log("OFFFFFFFFFFFFF");
}

// Called when the video does not start for two seconds
function checkVideoStartDelay(videoState) {
    logging.withTime("Current video state is " + videoState);
    // transmit.broadcastBufferingClients(room);  // TODO: Refactor into generic room object
}





function playIfPreloadingFinished(room) {
    if (room.currentVideo.state == 5) {
        // If everyone's preloaded, play the video
        if (room.allPreloaded()) {
            if (room.currentVideo.duration == 0) {
                logging.withTime("[Preload] Video details not recieved, cannot play video.");
                return 2;  // Error
            }
            // Set all the receivers playing
            // sendPlayerControl("play");
            logging.withTime("[Preload] Everyone has finished preloading, playing the video " + room.allPreloaded());
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
        // logging.consoleLogWithTime("[BufferMgnt] " + logging.prettyPrintClientID(client) + " is buffering. The video has been paused.");
        return 3;
        // If client is playing
    } else if (status.state == 1) {
        // If anyone was previously listed as buffering
        // TODO: Let the room handle the buffering, not the array - may want to use callbacks
        // if (buffering.length > 0) {
        //     // Remove this client from the buffering array, they're ready
        //     logging.consoleLogWithTime("[BufferMgnt] " + logging.prettyPrintClientID(client) + " has stopped buffering.");
        //     buffering.splice(buffering.indexOf(client.id), 1);
        //     // If that means no one is buffering now, resume everyone
        //     if (buffering.length == 0) {
        //         logging.consoleLogWithTime("[BufferMgnt] No one is buffering, resuming the video.");
        //         // sendPlayerControl("play");  // Play all the receivers
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




function sendTimestampIfClientRequires(client, room) {
    if (room.currentVideo.state != 0 && client.status.requiresTimestamp) {
        // We'll send the client a timestamp so it can sync with the server
        client.status.requiresTimestamp = false;
        logging.withTime("[ClientVideo] " + logging.prettyPrintClientID(client) + " requires a timestamp. Sending one to it now.");
        console.log("[CliMgnt] " + logging.prettyPrintClientID(client) + " has been sent a timestamp.");
        try {
            transmit.sendIndividualTimestamp(client, room.currentVideo.getElapsedTime());
        } catch (error) {
            console.error(error);
        }

    } else {
        return 1;  // The client doesn't need a timestamp
    }
    return 0;  // Don't continue with this function
}


// Set a new video playing on the server
function preloadNewVideoInRoom(videoObj, room) {
    transmit.broadcastPreloadVideo(room, videoObj);
    room.currentVideo = new server.ServerVideo();
    Object.assign(room.currentVideo, videoObj);
    room.currentVideo.onPlayDelay(checkVideoStartDelay);
    room.currentVideo.state = 5;
    room.currentVideo.onStateChange(function (state) {
        console.log("[ServerVideo] State " + state);
        switch (state) {
            case 1:
                transmit.broadcastPlayerControl(room, "play");

                break;
            case 2:

            // break; Fall through
            case 3:
                transmit.broadcastPlayerControl(room, "pause");
                break;
            case 5:

                break;
            default:
                break;
        }
    })
    room.currentVideo.whenFinished(function () {
        // Video has finished.

        logging.withTime("[ServerVideo] The video has finished. Elapsed time: " + room.currentVideo.getElapsedTime());
        playNextInQueue(room);
    });
}

module.exports.preloadNewVideoInRoom = preloadNewVideoInRoom;

// function sendAllData(room, client) {
//     transmit.sendQueue(room, client);
//     transmit.sendQueueStatus(room, client);
//     if (room.currentVideo.state == 1) transmit.sendNowPlaying(room, client, room.currentVideo);
//     client.socket.binary(false).emit('initFinished');
// }
// module.exports.sendAllData = sendAllData;