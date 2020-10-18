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
    socket.on('disconnect', () => callbacks.onDisconnected(socket.id));

    socket.on("initFinished", (data) => callbacks.onInitFinished(data));
    socket.on("serverQueueFinished", (data) => callbacks.onServerQueueFinished(data));
    socket.on("serverQueueStatus", (data) => callbacks.onServerQueueStatus(data));
    socket.on("serverQueueVideos", (data) => callbacks.onServerQueueVideos(data));
    socket.on("serverClients", (data) => callbacks.onServerClients(data));
    socket.on("serverCurrentVideo", (data) => callbacks.onServerCurrentVideo(data));
    socket.on("serverNewVideo", (data) => callbacks.onServerNewVideo(data));
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

export function onConnected(callback) {
    callbacks.onConnected = callback;
}

export function onDisonnected(callback) {
    callbacks.onDisconnected = callback;
}

export function onInitFinished(callback) {
    callbacks.onInitFinished = callback;
}

export function onServerQueueFinished(callback) {
    callbacks.onServerQueueFinished = callback;
}

export function onServerQueueStatus(callback) {
    callbacks.onServerQueueStatus = callback;
}

export function onServerQueueVideos(callback) {
    callbacks.onServerQueueVideos = callback;
}

export function onServerClients(callback) {
    callbacks.onServerClients = callback;
}

export function onServerCurrentVideo(callback) {
    callbacks.onServerCurrentVideo = callback;
}

export function onServerNewVideo(callback) {
    callbacks.onServerNewVideo = callback;
}