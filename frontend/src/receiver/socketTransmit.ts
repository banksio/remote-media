import { io, Socket } from "socket.io-client";

export let socket: Socket;

const callbacks = {
    onConnected: (socketID: string) => {},
    onDisconnected: () => {},
    onServerConnectionManagement: (data: any) => {},
    onServerBufferingClients: (data: any) => {},
    onServerPlayerControl: (data: any) => {},
    onServerNewVideo: (data: any, callback: any) => {},
    onServerVideoTimestamp: (data: any) => {},
};

export function connectToSocket(href: string) {
    const url = href;
    const arr = url.split("/");
    const result = arr[0] + "//" + arr[2].split(":")[0];
    socket = io(result + "/");

    // On connection
    socket.on("connect", () => callbacks.onConnected(socket.id));

    // On loss of connection
    socket.on("disconnect", () => callbacks.onDisconnected());

    socket.on("serverConnectionManagement", data => callbacks.onServerConnectionManagement(data));
    socket.on("serverBufferingClients", data => callbacks.onServerBufferingClients(data));
    socket.on("serverPlayerControl", data => callbacks.onServerPlayerControl(data));
    socket.on("serverNewVideo", (data, callback) => callbacks.onServerNewVideo(data, callback));
    socket.on("serverVideoTimestamp", data => callbacks.onServerVideoTimestamp(data));
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

// export function onEventReceived(callback) {
//     callbacks.onEventReceived = callback;
// }

export function onConnected(callback: (socketID: string) => void) {
    callbacks.onConnected = callback;
}

export function onDisonnected(callback: () => void) {
    callbacks.onDisconnected = callback;
}

export function onServerConnectionManagement(callback: (data: string) => void) {
    callbacks.onServerConnectionManagement = callback;
}

export function onServerBufferingClients(callback: (data: any[]) => void) {
    callbacks.onServerBufferingClients = callback;
}

export function onServerPlayerControl(callback: (data: string) => void) {
    callbacks.onServerPlayerControl = callback;
}

export function onServerNewVideo(callback: (data: any, callback: any) => void) {
    callbacks.onServerNewVideo = callback;
}

export function onServerVideoTimestamp(callback: (ts: number) => void) {
    callbacks.onServerVideoTimestamp = callback;
}
