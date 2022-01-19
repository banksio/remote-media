import { io, Socket } from "socket.io-client";

export let socket: Socket;

type socketIDCallback = (socketID: string) => void;
type genericDataCallback = (data: any) => void;

const callbacks = {
    onConnected: (socketID: string) => {},
    onDisconnected: (socketID: string) => {},
    onInitFinished: (data: any) => {},
    onServerQueueFinished: (data: any) => {},
    onServerQueueStatus: (data: any) => {},
    onServerQueueVideos: (data: any) => {},
    onServerNewVideo: (data: any) => {},
    onServerClients: (data: any) => {},
    onServerCurrentVideo: (data: any) => {},
    onServerVideoTimestamp: (data: any) => {},
};

export function connectToSocket(href: string) {
    const url = href;
    const arr = url.split("/");
    const result = arr[0] + "//" + arr[2].split(":")[0];
    socket = io(result + ":3694/");

    // On connection
    socket.on("connect", () => callbacks.onConnected(socket.id));

    // On loss of connection
    socket.on("disconnect", () => callbacks.onDisconnected(socket.id));

    socket.on("initFinished", data => callbacks.onInitFinished(data));
    socket.on("serverQueueFinished", data => callbacks.onServerQueueFinished(data));
    socket.on("serverQueueStatus", data => callbacks.onServerQueueStatus(data));
    socket.on("serverQueueVideos", data => callbacks.onServerQueueVideos(data));
    socket.on("serverClients", data => callbacks.onServerClients(data));
    socket.on("serverCurrentVideo", data => callbacks.onServerCurrentVideo(data));
    socket.on("serverNewVideo", data => callbacks.onServerNewVideo(data));
}

export function disconnectFromSocket() {
    socket.disconnect();
}

export function sendEvent(eventName: string, data: any) {
    if (!data) {
        socket.emit(eventName);
    } else {
        socket.emit(eventName, data);
    }
}

export function sendEventWithCallback(eventName: string, data: any, callback: (data: any) => any) {
    socket.emit(eventName, data, callback);
}

export function onConnected(callback: socketIDCallback) {
    callbacks.onConnected = callback;
}

export function onDisonnected(callback: socketIDCallback) {
    callbacks.onDisconnected = callback;
}

export function onInitFinished(callback: genericDataCallback) {
    callbacks.onInitFinished = callback;
}

export function onServerQueueFinished(callback: genericDataCallback) {
    callbacks.onServerQueueFinished = callback;
}

export function onServerQueueStatus(callback: genericDataCallback) {
    callbacks.onServerQueueStatus = callback;
}

export function onServerQueueVideos(callback: genericDataCallback) {
    callbacks.onServerQueueVideos = callback;
}

export function onServerClients(callback: genericDataCallback) {
    callbacks.onServerClients = callback;
}

export function onServerCurrentVideo(callback: genericDataCallback) {
    callbacks.onServerCurrentVideo = callback;
}

export function onServerNewVideo(callback: genericDataCallback) {
    callbacks.onServerNewVideo = callback;
}
