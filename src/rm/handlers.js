const chalk = require('chalk');
var server = require('./classes');
const rmUtilities = require('./utils');
const logging = require('./logging');
const transmit = require('./socketTransmit');
const utils = require('./utils');
const { event } = require("../../web/js/event")


function clientConnect(room, socket) {
    // Call the newClient event to add a new client
    // Return the new client for the calling function to use
    return room.incomingEvents.newClient(socket)
}


function clientDisconnect(room, client) {
    // Call the newClient event to remove the client
    room.incomingEvents.disconnectClient(client);
}


// Not a room event
// TODO: Refactor
function AdminConnectionManagement(room, control) {
    logging.debug("Connection management request recieved.");
    switch (control) {
        case "reload":
            transmit.broadcastConnectionManagement(room, "reload");
            logging.debug("[CliMgnt] Reloading all clients...");
            break;
        case "discon":
            transmit.broadcastConnectionManagement(room, "discon");
            logging.debug("[CliMgnt] Disconnecting all clients...");
            break;
        default:
            break;
    }
}


function AdminQueueControl(room, data) {
    // Call the queueControl event to modify the queue
    room.incomingEvents.queueControl(data);
}


function AdminPlayerControl(room, data) {
    // Call the videoControl event to change the state of the video
    room.incomingEvents.videoControl(data);
}


// ! Needs work
// TODO: Refactor
function AdminTTSRequest(room, data) {
    room.io.binary(false).emit("serverTTSSpeak", data.value);
}


function AdminQueueAppend(room, data, callback) {
    // Call queueAppend event to add videos to queue
    callback(room.incomingEvents.queueAppend(data.value));
    return;
}


function AdminNewVideo(room, data, callback) {
    // Call the new video event to set a new video in the room
    callback(room.incomingEvents.newVideo(data.value));
    return;
}


function ReceiverPlayerStatus(room, client, data) {
    // Call the receiver player status room event
    room.incomingEvents.receiverPlayerStatus(data, client);
}


function ReceiverVideoDetails(room, client, videoDetails) {
    // Call the video details event to assign the details of the video to the server
    room.incomingEvents.receiverVideoDetails(videoDetails, client);
}


function ReceiverTimestampSyncRequest(room, data, callback) {
    // Call the newTimestamp event to set the video timestamp
    room.incomingEvents.newTimestamp(data, callback);
}


function ReceiverTimestampRequest(room, client, data, callback) {
    logging.info("[CliMgnt] " + logging.prettyPrintClientID(client) + " has requested a timestamp.");
    room.incomingEvents.currentTimestampRequest(data, callback);
}


function ReceiverPlayerReady(room, client) {
    // Call the receiver ready event to send the current video if there's one playing
    room.incomingEvents.receiverReady(client);
}


function ReceiverNickname(room, client, nick, callback) {
    // Empty response is success, tells receiver to continue
    callback(room.incomingEvents.receiverNickname(nick, client));
}


function ReceiverPreloadingFinished(room, client, videoID) {
    // Call the receiver preloading finished event
    try {
        // This could throw if the client is on the wrong video
        room.incomingEvents.receiverPreloadingFinished(videoID, client);
    } catch (error) {
        if (error == "Wrong video"){
            logging.warn(logging.prettyPrintClientID(client) + " is on the wrong video.");
            return;
        }
    }
}


function onRoomEvent(eventObj, room) {
    // Pass event and data to transmit
    transmit.broadcastEventObject(room.io, eventObj);
}


function onClientEvent(eventObj, room, client) {
    // Pass event and data to transmit, with client id for identifying client to send to
    transmit.sendEventObject(room.io, client.id, eventObj);
}


module.exports = {
    clientConnect,
    clientDisconnect,
    AdminConnectionManagement,
    AdminQueueControl,
    AdminPlayerControl,
    AdminTTSRequest,
    AdminQueueAppend,
    AdminNewVideo,
    ReceiverPlayerStatus,
    ReceiverVideoDetails,
    ReceiverTimestampSyncRequest,
    ReceiverTimestampRequest,
    ReceiverPlayerReady,
    ReceiverNickname,
    ReceiverPreloadingFinished,
    onRoomEvent,
    onClientEvent
}