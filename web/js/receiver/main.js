import * as player from "./player.js";
import * as transmit from "./socketTransmit.js";
import * as frontendUI from "./ui.js";
import * as clickHandlers from "./uiEvents.js";
import * as screensaver from "./dvd.js";

const receiverDetails = {};

window.onYouTubeIframeAPIReady = player.onYouTubeIframeAPIReady;
window.onPlayerReady = player.onPlayerReady;
window.onPlayerStateChange = player.onPlayerStateChange;

screensaver.start();

transmit.onConnected((socketID) => {
    console.log("Connected to server with socket ID " + socketID);
    frontendUI.frontendChangeConnectionIdentifier(1);
    // If there's a nickname set, then try and set this with the server again
    if (receiverDetails.nickname) {
        checkNickname(receiverDetails.nickname);
    }
})

transmit.onDisonnected(() => {
    frontendUI.frontendChangeConnectionIdentifier(0);
})

// When the server sends a client connection management command
transmit.onServerConnectionManagement((data) => {
    switch (data) {
        case "reload":
            location.reload();
            break;
        case "discon":
            transmit.disconnectFromSocket();
            frontendUI.frontendChangeConnectionIdentifier(2);
            break;
        default:
            console.log("Unknown site command.");
    }
})

// When clients are buffering
transmit.onServerBufferingClients((buffering) => {
    if (buffering.length == 0) {
        return frontendUI.showNotificationBanner("Everyone's ready", false);
    }
    let names = formatBufferingClientNames(buffering);
    frontendUI.showNotificationBanner(names, true, true);
})


// * Connect to the socket
transmit.connectToSocket(window.location.href);

player.onEvent((eventName, data) => {
    console.log(eventName + ": " + data);
    transmit.sendEvent(eventName, data);
});

player.onNewStatus((status, preloading) => {
    if (preloading) {  // If we're preloading
        document.title = "Remote Media";
        switch (status) {
            case 1:  // And the video is now playing
                // Update the tab title with the current Video ID
                document.title = player.getCurrentVideoData().title + " - Remote Media";
                break;
            default:
                break;
        }
    } else {
        switch (status) {
            case 0:
                document.title = "Remote Media";
                screensaver.start();
                break;
            case 1:
                // Update the tab title with the current Video ID
                document.title = player.getCurrentVideoData().title + " - Remote Media";
                screensaver.stop();
            // break; // Fall through to next case
            case 2:
                compareWithServerTimestamp();
        }
    }
})

player.loadYouTubeIframeAPI();

transmit.onServerPlayerControl((data) => player.serverPlayerControl(data));
transmit.onServerNewVideo((data) => player.preloadVideo(data.value));
transmit.onServerVideoTimestamp((ts) => player.skipToTimestamp(ts));

frontendUI.initNicknameModal((nickname) => {
    checkNickname(nickname);
});

clickHandlers.onResyncClick(() => {
    requestTimestampFromServer();
})

clickHandlers.onPushTSClick(() => {
    pushTimestampToServer(player.getCurrentTimestamp());
})

function formatBufferingClientNames(buffering) {
    let names = "Waiting for ";

    while (buffering.length > 2) {
        names += (buffering.pop()._name + ", ");
    }
    while (buffering.length > 1) {
        names += (buffering.pop()._name + " and ");
    }
    while (buffering.length > 0) {
        names += buffering.pop()._name;
    }

    return names;
}

// Ask the server to validate the nickname and get the response
function checkNickname(nick) {
    transmit.sendEventWithCallback('receiverNickname', nick, (error) => { // Async callback with server's validation response
        // If response is undefined, we're good - hide the modal
        if (error === null) {
            receiverDetails.nickname = nick;
            frontendUI.hideNicknameModal();
            frontendUI.showNotificationBanner("Set nickname: " + receiverDetails.nickname, false, false);
            return;
        }
        frontendUI.showNicknameModal();
        // If response is anything else, there's been an error
        alert("Setting nickname has been encountered an error: " + error);
        return error;
    });
}


export function requestTimestampFromServer() {
    frontendUI.showNotificationBanner("Re syncing...", true, true);
    let data = player.getVideoIDObj();
    // Ask the server for the current timestamp
    transmit.sendEventWithCallback('receiverTimestampRequest', data, (timestamp, error) => {
        if (error) {
            frontendUI.showNotificationBanner("Error getting server timestamp: " + error, false, false);
            return;
        } // args are sent in order to acknowledgement function
        // Skip to the correct time
        player.skipToTimestamp(timestamp);
    });
}

function compareWithServerTimestamp() {
    let data = player.getVideoIDObj();
    // Ask the server for the current timestamp
    transmit.sendEventWithCallback('receiverTimestampRequest', data, (timestamp, error) => { // args are sent in order to acknowledgement function
        if (error) {
            frontendUI.showNotificationBanner("Error getting server timestamp: " + error, false, false);
            return;
        }
        // If they're more than 2 seconds apart, show the menu
        if (compareTimestamps(player.getCurrentTimestamp(), timestamp)) {
            frontendUI.frontendShowSideControlPanel(true);
        } else {
            frontendUI.frontendShowSideControlPanel(false);
        }
    });
}

function compareTimestamps(client, server) {
    console.log("CLIENT " + client);
    console.log("SERVER " + server);
    if (client > server + 2000) {
        return true;
    } else if (client < server - 2000) {
        return true;
    }
    return false;
}

function pushTimestampToServer(timestamp) {
    frontendUI.showNotificationBanner("Syncing others...", true, true);
    let data = {
        timestamp: timestamp,
        videoID: player.getCurrentVideoID()
    }
    transmit.sendEventWithCallback("receiverTimestampSyncRequest", data, (error) => {
        if (error) {
            frontendUI.showNotificationBanner("Error syncing others: " + error, false, false);
        }
    });
}