// import { Socket } from "socket.io";
// import { event } from "../web/static/js/event";
// import { Client } from "./client/client";
// import { debug, info, prettyPrintClientID, warning } from "./logging";
// import { OldRoom } from "./room";

import { Socket } from "socket.io";
import { transport } from "..";
import { event } from "./event/event";
import { newClient } from "./event/newClient";
import { setReceiverNickname } from "./event/receiverNickname";
import { removeClient } from "./event/removeClient";
import { videoForcePush } from "./event/videoForcePush";

export function clientConnect(roomName: string, clientID: string): void {
    // Call the newClient event to add a new client
    newClient(roomName, clientID).then(event => {
        transport.handleEvent(clientID, event);
    });
}

export function clientDisconnect(roomName: string, clientID: string): void {
    // Call the removeClient event to remove a client
    removeClient(roomName, clientID).then(event => {
        transport.broadcastEvent(event);
    });
}

export const receiverNickname = async (
    roomName: string,
    clientID: string,
    nickname: string
): Promise<void> => {
    return setReceiverNickname(roomName, clientID, nickname).then(event => {
        transport.broadcastEvent(event);
    });
};

export const handleVideoForcePush = async (
    roomName: string,
    clientID: string,
    videoURL: string
) => {
    return videoForcePush(roomName, clientID, videoURL).then(event => {
        // transport.broadcastEvent(event);
    });
};

// // Not a room event
// // TODO: Refactor
// export function AdminConnectionManagement(room: OldRoom, control: string) {
//     debug("Connection management request recieved.");
//     switch (control) {
//         case "reload":
//             broadcastConnectionManagement(room, "reload");
//             debug("[CliMgnt] Reloading all clients...");
//             break;
//         case "discon":
//             broadcastConnectionManagement(room, "discon");
//             debug("[CliMgnt] Disconnecting all clients...");
//             break;
//         default:
//             break;
//     }
// }

// export function AdminQueueControl(room: OldRoom, data: any) {
//     // Call the queueControl event to modify the queue
//     room.incomingEvents.queueControl(data);
// }

// export function AdminPlayerControl(room: OldRoom, data: any) {
//     // Call the videoControl event to change the state of the video
//     room.incomingEvents.videoControl(data);
// }

// // ! Needs work
// // TODO: Refactor
// export function AdminTTSRequest(room: OldRoom, data: any) {
//     room.io.emit("serverTTSSpeak", data.value);
// }

// export function AdminQueueAppend(room: OldRoom, data: any, callback: CallableFunction) {
//     // Call queueAppend event to add videos to queue
//     callback(room.incomingEvents.queueAppend(data.value));
//     return;
// }

// export function AdminNewVideo(room: OldRoom, data: any, callback: CallableFunction) {
//     // Call the new video event to set a new video in the room
//     callback(room.incomingEvents.newVideo(data.value));
//     return;
// }

// export function ReceiverPlayerStatus(room: OldRoom, client: Client, data: any) {
//     // Call the receiver player status room event
//     room.incomingEvents.receiverPlayerStatus(data, client);
// }

// export function ReceiverVideoDetails(room: OldRoom, client: Client, videoDetails: any) {
//     // Call the video details event to assign the details of the video to the server
//     room.incomingEvents.receiverVideoDetails(videoDetails, client);
// }

// export function ReceiverTimestampSyncRequest(room: OldRoom, data: any, client: Client, callback: CallableFunction) {
//     // Call the newTimestamp event to set the video timestamp
//     room.incomingEvents.newTimestamp(data, client, callback);
// }

// export function ReceiverTimestampRequest(room: OldRoom, client: Client, data: any, callback: CallableFunction) {
//     info("[CliMgnt] " + prettyPrintClientID(client) + " has requested a timestamp.");
//     room.incomingEvents.currentTimestampRequest(data, callback);
// }

// export function ReceiverPlayerReady(room: OldRoom, client: Client) {
//     // Call the receiver ready event to send the current video if there's one playing
//     room.incomingEvents.receiverReady(client);
// }

// export function ReceiverNickname(room: OldRoom, client: Client, nick: string, callback: CallableFunction) {
//     // Empty response is success, tells receiver to continue
//     callback(room.incomingEvents.receiverNickname(nick, client));
// }

// export function ReceiverPreloadingFinished(room: OldRoom, client: Client, videoID: string) {
//     // Call the receiver preloading finished event
//     try {
//         // This could throw if the client is on the wrong video
//         room.incomingEvents.receiverPreloadingFinished(videoID, client);
//     } catch (error) {
//         if (error == "Wrong video"){
//             warning(prettyPrintClientID(client) + " is on the wrong video.");
//             return;
//         }
//     }
// }

// export function onRoomEvent(eventObj: event, room: OldRoom) {
//     // Pass event and data to transmit
//     broadcastEventObject(room.io, eventObj);
// }

// export function onClientEvent(eventObj: event, room: OldRoom, client: Client) {
//     // Pass event and data to transmit, with client id for identifying client to send to
//     sendEventObject(room.io, client.id, eventObj);
// }

// export function onNotClientEvent(eventObj: event, room: OldRoom, client: Client) {
//     // Pass event and data to transmit, with client id for identifying client to exclude
//     broadcastNotClientEventObject(room.io, client.id, eventObj);
// }
