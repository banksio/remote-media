import { putVideo } from "./fetch";
import * as transmit from "./socketTransmit.js";
import * as frontendUI from "./ui.js";
import * as clickHandlers from "./uiEvents.js";
import TableWorker from './worker?worker'

import "popper.js";

import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "../../stylesheets/adminStyles.css";

const tableWorker = new TableWorker();
const queue = {
    index: 0,
    shuffle: false,
    videos: [],
    length: 0,
};

transmit.onInitFinished(() => {
    frontendUI.changeMainSpinner(0);
});

transmit.onConnected((socketID: string) => {
    console.log("Connected to " + socketID);
    frontendUI.changeConnectionIdentifier(true);
    frontendUI.changeMainSpinner(1);
    frontendUI.changeMainThumbnail();
});

transmit.onDisonnected((socketID: string) => {
    console.log("Disconnected from " + socketID);
    frontendUI.changeConnectionIdentifier(false);
});

transmit.onServerNewVideo(() => {
    frontendUI.changeThumbnailSpinner(true); // Show loading of thumbnail
});

transmit.onServerCurrentVideo((video: any) => {
    video = JSON.parse(video);
    console.log("Recieved video details from server");
    frontendUI.changeMainThumbnail(video);
    frontendUI.changeThumbnailSpinner(false);
});

transmit.onServerClients((clients: any) => frontendUI.updateClientsTable(clients));

transmit.onServerQueueVideos((queueData: any) => {
    frontendUI.changeMainSpinner(1, "Updating queue...");
    queue.videos = queueData.videos;
    queue.index = queueData.index;
    queue.length = queueData.length;

    // Repopulate the table
    repopulateQueueTable(queue);
    // Update the "next up" indicator
    frontendUI.updateQueueFrontend(queue);

    // queueUpdateStatus(queueData);
});

function repopulateQueueTable(queue: any) {
    tableWorker.postMessage(queue);
}

tableWorker.onmessage = function (e) {
    frontendUI.updatePlaylistTableHTML(e.data);
    console.log("Worker has finished processing playlist");
    frontendUI.changeAppendVideoButtonEnabled(true);
    frontendUI.changeMainSpinner(0);
};

transmit.onServerQueueStatus((status: any) => queueUpdateStatus(status));

transmit.onServerQueueFinished(() => frontendUI.changeMainThumbnail());

function queueUpdateStatus(status: any) {
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

function pushNewVideo(videoID: string) {
    frontendUI.changeNewVideoButtonEnabled(false);
    frontendUI.changeMainSpinner(1, "Pushing video...");
    putVideo(videoID)
        .then(() => {
            frontendUI.changeNewVideoButtonEnabled(true);
            frontendUI.changeMainSpinner(0);
        })
        .catch(error => {
            alert(error);
        });
}

function appendNewVideo(videoID: string) {
    frontendUI.changeAppendVideoButtonEnabled(false);
    frontendUI.changeMainSpinner(1, "Adding to queue...");
    transmit.sendEventWithCallback("adminQueueAppend", { value: videoID }, (error: Error) => {
        frontendUI.changeAppendVideoButtonEnabled(true);
        frontendUI.changeMainSpinner(0);
        if (error) {
            alert(error);
        }
    });
}

function toggleShuffle(toggled: boolean) {
    frontendUI.changeMainSpinner(1, "Shuffling queue...");
    transmit.sendEvent("adminQueueControl", "toggleShuffle");
}

// Play and Pause buttons
clickHandlers.onPlayClick(() => transmit.sendEvent("adminPlayerControl", "play"));
clickHandlers.onPauseClick(() => transmit.sendEvent("adminPlayerControl", "pause"));

// Next, Previous and Empty playlist buttons
clickHandlers.onNextClick(() => transmit.sendEvent("adminQueueControl", "skip"));
clickHandlers.onPreviousClick(() => transmit.sendEvent("adminQueueControl", "prev"));
clickHandlers.onEmptyPlaylistClick(() => transmit.sendEvent("adminQueueControl", "empty"));

// Shuffle playlist toggle
clickHandlers.onPlaylistShuffle((shuffled: boolean) => toggleShuffle(shuffled));

// Push and Append video buttons
clickHandlers.onPushVideoClick((videoID: string) => pushNewVideo(videoID));
clickHandlers.onAppendVideoClick((videoID: string) => appendNewVideo(videoID));

// Client management buttons
clickHandlers.onReloadClientsClick(() => transmit.sendEvent("adminConnectionManagement", "reload"));
clickHandlers.onDisconnectClientsClick(() => transmit.sendEvent("adminConnectionManagement", "discon"));

transmit.connectToSocket(window.location.href);
