import { Socket } from "socket.io";
import { event } from "../web/static/js/event";
import { Login } from "./client/client";
import { debug, info, prettyPrintClientID, warning } from "./logging";
import { Room } from "./room";
import { broadcastConnectionManagement, broadcastEventObject, broadcastNotClientEventObject, sendEventObject } from "./socketTransmit";

export function clientConnect(room: Room, socket: Socket) {
    // Call the newClient event to add a new client
    // Return the new client for the calling export function to use
    return room.incomingEvents.newClient(socket)
}


export function clientDisconnect(room: Room, client: Login) {
    // Call the newClient event to remove the client
    room.incomingEvents.disconnectClient(client);
}


// Not a room event
// TODO: Refactor
export function AdminConnectionManagement(room: Room, control: string) {
    debug("Connection management request recieved.");
    switch (control) {
        case "reload":
            broadcastConnectionManagement(room, "reload");
            debug("[CliMgnt] Reloading all clients...");
            break;
        case "discon":
            broadcastConnectionManagement(room, "discon");
            debug("[CliMgnt] Disconnecting all clients...");
            break;
        default:
            break;
    }
}


export function AdminQueueControl(room: Room, data: any) {
    // Call the queueControl event to modify the queue
    room.incomingEvents.queueControl(data);
}


export function AdminPlayerControl(room: Room, data: any) {
    // Call the videoControl event to change the state of the video
    room.incomingEvents.videoControl(data);
}


// ! Needs work
// TODO: Refactor
export function AdminTTSRequest(room: Room, data: any) {
    room.io.emit("serverTTSSpeak", data.value);
}


export function AdminQueueAppend(room: Room, data: any, callback: CallableFunction) {
    // Call queueAppend event to add videos to queue
    callback(room.incomingEvents.queueAppend(data.value));
    return;
}


export function AdminNewVideo(room: Room, data: any, callback: CallableFunction) {
    // Call the new video event to set a new video in the room
    callback(room.incomingEvents.newVideo(data.value));
    return;
}


export function ReceiverPlayerStatus(room: Room, client: Login, data: any) {
    // Call the receiver player status room event
    room.incomingEvents.receiverPlayerStatus(data, client);
}


export function ReceiverVideoDetails(room: Room, client: Login, videoDetails: any) {
    // Call the video details event to assign the details of the video to the server
    room.incomingEvents.receiverVideoDetails(videoDetails, client);
}


export function ReceiverTimestampSyncRequest(room: Room, data: any, client: Login, callback: CallableFunction) {
    // Call the newTimestamp event to set the video timestamp
    room.incomingEvents.newTimestamp(data, client, callback);
}


export function ReceiverTimestampRequest(room: Room, client: Login, data: any, callback: CallableFunction) {
    info("[CliMgnt] " + prettyPrintClientID(client) + " has requested a timestamp.");
    room.incomingEvents.currentTimestampRequest(data, callback);
}


export function ReceiverPlayerReady(room: Room, client: Login) {
    // Call the receiver ready event to send the current video if there's one playing
    room.incomingEvents.receiverReady(client);
}


export function ReceiverNickname(room: Room, client: Login, nick: string, callback: CallableFunction) {
    // Empty response is success, tells receiver to continue
    callback(room.incomingEvents.receiverNickname(nick, client));
}


export function ReceiverPreloadingFinished(room: Room, client: Login, videoID: string) {
    // Call the receiver preloading finished event
    try {
        // This could throw if the client is on the wrong video
        room.incomingEvents.receiverPreloadingFinished(videoID, client);
    } catch (error) {
        if (error == "Wrong video"){
            warning(prettyPrintClientID(client) + " is on the wrong video.");
            return;
        }
    }
}


export function onRoomEvent(eventObj: event, room: Room) {
    // Pass event and data to transmit
    broadcastEventObject(room.io, eventObj);
}


export function onClientEvent(eventObj: event, room: Room, client: Login) {
    // Pass event and data to transmit, with client id for identifying client to send to
    sendEventObject(room.io, client.id, eventObj);
}

export function onNotClientEvent(eventObj: event, room: Room, client: Login) {
    // Pass event and data to transmit, with client id for identifying client to exclude
    broadcastNotClientEventObject(room.io, client.id, eventObj);
}
