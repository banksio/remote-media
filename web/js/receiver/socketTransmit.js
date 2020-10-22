var socket;

const callbacks = {};

export function connectToSocket(href){
    var url = href;
    var arr = url.split("/");
    var result = arr[0] + "//" + arr[2];
    // eslint-disable-next-line no-undef
    socket = io(result + "/");

    // On connection
    socket.on('connect', () => callbacks.onConnected(socket.id));

    // On loss of connection
    socket.on('disconnect', () => callbacks.onDisconnected());

    socket.on("serverConnectionManagement", (data) => callbacks.onServerConnectionManagement(data));
    socket.on("serverBufferingClients", (data) => callbacks.onServerBufferingClients(data));
    socket.on("serverPlayerControl", (data) => callbacks.onServerPlayerControl(data));
    socket.on("serverNewVideo", (data) => callbacks.onServerNewVideo(data));
    socket.on("serverVideoTimestamp", (data) => callbacks.onServerVideoTimestamp(data));
}

export function disconnectFromSocket() {
    socket.disconnect();
}

export function sendEvent(eventName, data){
    if (!data){
        socket.binary(false).emit(eventName);
    } else {
        socket.binary(false).emit(eventName, data);
    }
}

export function sendEventWithCallback(eventName, data, callback){
    socket.binary(false).emit(eventName, data, callback);
}

export function onEventReceived(callback) {
    callbacks.onEventReceived = callback;
}

export function onConnected(callback) {
    callbacks.onConnected = callback;
}

export function onDisonnected(callback) {
    callbacks.onDisconnected = callback;
}

export function onServerConnectionManagement(callback) {
    callbacks.onServerConnectionManagement = callback;
}

export function onServerBufferingClients(callback) {
    callbacks.onServerBufferingClients = callback;
}

export function onServerPlayerControl(callback) {
    callbacks.onServerPlayerControl = callback;
}

export function onServerNewVideo(callback) {
    callbacks.onServerNewVideo = callback;
}

export function onServerVideoTimestamp(callback) {
    callbacks.onServerVideoTimestamp = callback;
}