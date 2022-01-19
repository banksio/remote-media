import * as player from "./player";
import * as transmit from "./socketTransmit";
import * as frontendUI from "./ui.js";
import * as clickHandlers from "./uiEvents.js";
import * as screensaver from "./dvd.js";
import { putNickname } from "./fetch";

import "popper.js";

import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "../../stylesheets/receiverStyles.css";
import { consoleErrorWithTime, consoleLogWithTime } from "./debug";

const receiverDetails: { nickname?: string } = {};

declare global {
    interface Window {
        onYouTubeIframeAPIReady: any;
        onPlayerReady: any;
        onPlayerStateChange: any;
    }
}

window.onYouTubeIframeAPIReady = player.onYouTubeIframeAPIReady;
window.onPlayerReady = player.onPlayerReady;
window.onPlayerStateChange = player.onPlayerStateChange;

screensaver.start();

transmit.onConnected((socketID: string) => {
    consoleLogWithTime("[Connected] Server socket ID: " + socketID);
    frontendUI.frontendChangeConnectionIdentifier(1);
    // If there's a nickname set, then try and set this with the server again
    if (receiverDetails.nickname) {
        checkNickname(receiverDetails.nickname);
    }
});

transmit.onDisonnected(() => {
    frontendUI.frontendChangeConnectionIdentifier(0);
});

// When the server sends a client connection management command
transmit.onServerConnectionManagement((data: string) => {
    switch (data) {
        case "reload":
            location.reload();
            break;
        case "discon":
            transmit.disconnectFromSocket();
            frontendUI.frontendChangeConnectionIdentifier(2);
            break;
        default:
            consoleErrorWithTime("Received unknown site command.");
    }
});

// When clients are buffering
transmit.onServerBufferingClients((buffering: any[]) => {
    if (buffering.length === 0) {
        return frontendUI.showNotificationBanner("Everyone's ready", false);
    }
    const names = formatBufferingClientNames(buffering);
    frontendUI.showNotificationBanner(names, true, true);
});

// * Connect to the socket
transmit.connectToSocket(window.location.href);

player.onEvent((eventName: string, data: any) => {
    console.log(eventName + ": " + JSON.stringify(data));
    transmit.sendEvent(eventName, data);
});

player.onNewStatus((status: number, preloading: boolean) => {
    if (preloading) {
        // If we're preloading
        document.title = "Remote Media";
        switch (status) {
            case 1: // And the video is now playing
                // Update the tab title with the current Video ID
                document.title = player.getCurrentVideoData().title + " - Remote Media";
                break;
            default:
                break;
        }
    } else {
        // Not preloading, playing normally
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
                consoleLogWithTime("Big Status change");
                compareWithServerTimestamp();
                break;
            default:
                break;
        }
    }
});

player.loadYouTubeIframeAPI();

transmit.onServerPlayerControl((data: string) => player.serverPlayerControl(data));
transmit.onServerNewVideo((data: any, callback: any) => {
    player.preloadVideo(data.value).then(videoID => callback(videoID));
});
transmit.onServerVideoTimestamp((ts: number) => player.seekToTimestamp(ts, false));

frontendUI.initNicknameModal((nickname: string) => {
    checkNickname(nickname);
});

clickHandlers.onResyncClick(() => {
    requestTimestampFromServer();
});

clickHandlers.onPushTSClick(() => {
    pushTimestampToServer(player.getCurrentTimestamp());
});

function formatBufferingClientNames(buffering: any[]) {
    let names = "Waiting for ";

    while (buffering.length > 2) {
        names += buffering.pop()._name + ", ";
    }
    while (buffering.length > 1) {
        names += buffering.pop()._name + " and ";
    }
    while (buffering.length > 0) {
        names += buffering.pop()._name;
    }

    return names;
}

// Ask the server to validate the nickname and get the response
function checkNickname(nick: string) {
    const url = window.location.href;
    const arr = url.split("/");
    const result = arr[0] + "//" + arr[2];
    putNickname(result + "/api/nickname?client=" + transmit.socket.id, { name: nick })
        .then(() => {
            receiverDetails.nickname = nick;
            frontendUI.hideNicknameModal();
            frontendUI.showNotificationBanner(
                "Set nickname: " + receiverDetails.nickname,
                false,
                false
            );
            return;
        })
        .catch(error => {
            frontendUI.showNicknameModal();
            // If response is anything else, there's been an error
            alert("Setting nickname has been encountered an error: " + error.message);
            return error;
        });
}

export function requestTimestampFromServer() {
    frontendUI.showNotificationBanner("Re syncing...", true, true);
    const data = player.getVideoIDObj();
    // Ask the server for the current timestamp
    transmit.sendEventWithCallback(
        "receiverTimestampRequest",
        data,
        (timestamp: number, error?: Error) => {
            if (error) {
                frontendUI.showNotificationBanner(
                    "Error getting server timestamp: " + error,
                    false,
                    false
                );
                return;
            } // args are sent in order to acknowledgement function
            // Skip to the correct time
            player.seekToTimestamp(timestamp);
        }
    );
}

function compareWithServerTimestamp() {
    const data = player.getVideoIDObj();
    // Ask the server for the current timestamp
    transmit.sendEventWithCallback(
        "receiverTimestampRequest",
        data,
        (timestamp: number, error?: Error) => {
            // args are sent in order to acknowledgement function
            if (error) {
                frontendUI.showNotificationBanner(
                    "Error getting server timestamp: " + error,
                    false,
                    false
                );
                return;
            }
            consoleLogWithTime("Big ts compare");
            // If they're more than 2 seconds apart, show the menu
            if (compareTimestamps(player.getCurrentTimestamp(), timestamp)) {
                frontendUI.frontendShowSideControlPanel(true);
            } else {
                frontendUI.frontendShowSideControlPanel(false);
            }
        }
    );
}

function compareTimestamps(client: number, server: number) {
    // Print timestamps
    consoleLogWithTime("CLIENT " + client);
    consoleLogWithTime("SERVER " + server);
    if (client > server + 2000) {
        return true;
    } else if (client < server - 2000) {
        return true;
    }
    return false;
}

function pushTimestampToServer(timestamp: number) {
    player.serverPlayerControl("pause");
    frontendUI.showNotificationBanner("Syncing others...", true, true);
    const data = {
        timestamp: timestamp,
        videoID: player.getCurrentVideoID(),
    };
    transmit.sendEventWithCallback("receiverTimestampSyncRequest", data, (error?: Error) => {
        if (error) {
            frontendUI.showNotificationBanner("Error syncing others: " + error, false, false);
        }
    });
}
