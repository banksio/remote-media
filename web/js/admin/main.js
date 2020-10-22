import * as transmit from "./socketTransmit.js";
import * as frontendUI from "./ui.js";
import * as clickHandlers from "./uiEvents.js";

const tableWorker = new Worker('js/admin/worker.js');
const queue = {
    "index": 0,
    "shuffle": false,
    "videos": []
};

transmit.onInitFinished(() => {
    frontendUI.changeMainSpinner(0);
});

transmit.onConnected((socketID) => {
    console.log("Connected to " + socketID);
    frontendUI.changeConnectionIdentifier(true);
    frontendUI.changeMainSpinner(1);
})

transmit.onDisonnected((socketID) => {
    console.log("Disconnected from " + socketID);
    frontendUI.changeConnectionIdentifier(false);
})

transmit.onServerNewVideo(() => {
    frontendUI.changeThumbnailSpinner(true);  // Show loading of thumbnail
})

transmit.onServerCurrentVideo((video) => {
    video = JSON.parse(video);
    console.log("Recieved video details from server");
    frontendUI.changeMainThumbnail(video);
    frontendUI.changeThumbnailSpinner(false);
})

transmit.onServerClients((clients) => frontendUI.updateClientsTable(clients));

transmit.onServerQueueVideos((queueData) => {
    frontendUI.changeMainSpinner(1, "Updating queue...");
    queue.videos = queueData.videos;
    queue.index = queueData.index;
    queue.length = queueData.length;

    // Repopulate the table
    repopulateQueueTable(queue);
    // Update the "next up" indicator
    frontendUI.updateQueueFrontend(queue);

    // queueUpdateStatus(queueData);
})

function repopulateQueueTable(queue) {
    tableWorker.postMessage(queue);
}

tableWorker.onmessage = function(e) {
    frontendUI.updatePlaylistTableHTML(e.data);
    console.log("Worker has finished processing playlist");
    frontendUI.changeAppendVideoButtonEnabled(true);
    frontendUI.changeMainSpinner(0);
}

transmit.onServerQueueStatus((status) => queueUpdateStatus(status));

transmit.onServerQueueFinished(() => frontendUI.changeMainThumbnail());

function queueUpdateStatus(status) {
    // Update the status
    queue.shuffle = status.shuffle;
    queue.index = status.index;
    queue.length = status.length;

    if (status.shuffle == true) {
        frontendUI.checkPlaylistShuffleBox(true);
    } else {
        frontendUI.checkPlaylistShuffleBox(false);
    }

    frontendUI.updateQueueFrontend(queue);
}

function pushNewVideo(videoID) {
    frontendUI.changeNewVideoButtonEnabled(false);
    frontendUI.changeMainSpinner(1, "Pushing video...");
    transmit.sendEventWithCallback("adminNewVideo", { value: videoID, pass: true }, (error) => {
        frontendUI.changeNewVideoButtonEnabled(true);
        frontendUI.changeMainSpinner(0);
        if (error) {
            alert(error);
        }
    });
}

function appendNewVideo(videoID) {
    frontendUI.changeAppendVideoButtonEnabled(false);
    frontendUI.changeMainSpinner(1, "Adding to queue...");
    transmit.sendEventWithCallback("adminQueueAppend", { value: videoID }, (error) => {
        frontendUI.changeAppendVideoButtonEnabled(true);
        frontendUI.changeMainSpinner(0);
        if (error) {
            alert(error);
        }
    });
}

function toggleShuffle(toggled) {
    frontendUI.changeMainSpinner(1, "Shuffling queue...");
    transmit.sendEvent("adminQueueControl", "toggleShuffle");
}

// Play and Pause buttons
clickHandlers.onPlayClick(() => transmit.sendEvent("adminPlayerControl", "play"))
clickHandlers.onPauseClick(() => transmit.sendEvent("adminPlayerControl", "pause"))

// Next, Previous and Empty playlist buttons
clickHandlers.onNextClick(() => transmit.sendEvent("adminQueueControl", "skip"))
clickHandlers.onPreviousClick(() => transmit.sendEvent("adminQueueControl", "prev"))
clickHandlers.onEmptyPlaylistClick(() => transmit.sendEvent("adminQueueControl", "empty"))

// Shuffle playlist toggle
clickHandlers.onPlaylistShuffle((shuffled) => toggleShuffle(shuffled));

// Push and Append video buttons
clickHandlers.onPushVideoClick((videoID) => pushNewVideo(videoID));
clickHandlers.onAppendVideoClick((videoID) => appendNewVideo(videoID));

// Client management buttons
clickHandlers.onReloadClientsClick(() => transmit.sendEvent("adminConnectionManagement", "reload"));
clickHandlers.onDisconnectClientsClick(() => transmit.sendEvent("adminConnectionManagement", "discon"));

transmit.connectToSocket(window.location.href);