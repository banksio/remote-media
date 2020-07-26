const logging = require('../../logging');
const chalk = require('chalk');

// Send timestamp to a client
function sendIndividualTimestamp(client, timestamp) {
    client.socket.binary(false).emit("serverVideoTimestamp", timestamp);
}

// Send timestamp to all clients
function broadcastTimestamp(room, timestamp) {
    room.io.binary(false).emit("serverVideoTimestamp", timestamp);
}

function broadcastPreloadVideo(room, videoObj) {
    let newID = { "value": videoObj.id };
    logging.withTime("New Video ID sent: " + newID.value);
    // logging.withTime(chalk.red("Cannot broadcast no io"));
    room.io.binary(false).emit("serverNewVideo", newID);
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
   room.io.binary(false).emit("serverQueueVideos", queue);
}


function sendQueueStatus(room) {
    // Send the queue but remove the videos array, no need to send that
    let queueStatus = { shuffle: room.queue.shuffle };
    // queueStatus.videos = undefined;
    room.io.binary(false).emit("serverQueueStatus", queueStatus);
}


function sendNowPlaying(room, video) {
    // Update elapsed time
    // video.getElapsedTime(new Date().getTime());  // UPDATE no longer used
    // Send the current video object to all clients (and admin panels)
    // console.log(video);
    room.io.binary(false).emit("serverCurrentVideo", JSON.stringify(video, video.cyclicReplacer));
}

function sendPlayerControl(room, control) {
    room.io.binary(false).emit("serverPlayerControl", control);
}

function broadcastBufferingClients(room) {
    let buffering = room.getBuffering();
    buffering.forEach(client => {
        logging.withTime("Waiting on " + client.name + " with state " + client.status.state);
    });
    room.io.binary(false).emit("serverBufferingClients", buffering);
}

function broadcastBufferingIfClientNowReady(room, status) {
    // If the client is no longer 
    if (status.state < 3 && status.previousState >= 3) {
        broadcastBufferingClients(room);
    }
}

function broadcastClients(room) {
    let clients = room.clients;
    room.io.binary(false).emit("serverClients", clients);
}

function sendCurrentVideoToClient(room, client) {
    if (room.currentVideo.state != 0) {
        // There is a video playing, so the client will need to preload it and then go to the timestamp
        preloadVideoIndividualClient(client, room.currentVideo);
        // This client needs a timestamp ASAP, this should be picked up by the status checking function
        client.status.requiresTimestamp = true;
        return 0;
    } else {
        return 1;
    }
}

function preloadVideoIndividualClient(client, videoObj) {
    let newID = { "value": videoObj.id };
    logging.withTime("New Video ID sent to client " + client.socket.id + ": " + newID.value);
    client.socket.binary(false).emit("serverNewVideo", newID);
    return;
}

module.exports = {
    sendIndividualTimestamp: sendIndividualTimestamp,
    broadcastTimestamp: broadcastTimestamp,
    broadcastBufferingClients: broadcastBufferingClients,
    sendPlayerControl: sendPlayerControl,
    broadcastBufferingIfClientNowReady: broadcastBufferingIfClientNowReady,
    sendNowPlaying: sendNowPlaying,
    sendQueue: sendQueue,
    broadcastPreloadVideo: broadcastPreloadVideo,
    broadcastClients: broadcastClients,
    sendQueueStatus: sendQueueStatus,
    sendCurrentVideoToClient: sendCurrentVideoToClient
}