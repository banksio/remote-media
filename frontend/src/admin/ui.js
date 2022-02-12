import { Tab } from "bootstrap";

import { getMQThumbnailSrc, getThumbnailSrc } from "./utils.js";

import logo from "../../branding/logo.png";

// Frontend Elements
const previousButton = document.getElementById("prev");
const nextButton = document.getElementById("skip");
const connectionStatusText = document.getElementById("statusConnection");
const connectionStatusSpinner = document.getElementById("spinnerConnection");
const mainSpinner = document.getElementById("statusSpinner");
const mainSpinnerText = document.getElementById("statusLoading");
const thumbnailSpinner = document.querySelector("div.nowPlayingContainer > div");
const thumbnailLoadingText = document.getElementById("nowPlayingContainerLoadingText");

const upNextTitle = document.getElementById("videoTitleNext");
const upNextImage = document.getElementById("videoThumbnailNext");
const nowplayingTitleElement = document.getElementById("nowPlayingTitle");
const nowplayingChannelElement = document.getElementById("nowPlayingChannel");
const nowplayingThumbnail = document.getElementById("imgNowPlaying");

const checkQueueShuffle = document.getElementById("shuffleCheck");

// Buttons
const btnQueueAppend = document.querySelector("#queue > div.input-group > div > button");
const btnVideoPush = document.querySelector("#btnPushVideo");

// Tables
const clientsTable = document.getElementById("data-table-body");
const playlistTable = document.getElementById("playlist-table-body");

const stateIcons = [
    '<i class="fas fa-hourglass-half"></i>',
    '<i class="fas fa-stop"></i>',
    '<i class="fas fa-play"></i>',
    '<i class="fas fa-pause"></i>',
    '<div class="spinner-border spinner-border-sm"></div>',
    "Unknown",
    '<i class="fas fa-check"></i>',
];

nowplayingThumbnail.addEventListener("load", () => {
    changeThumbnailSpinner(false);
});

export function changeSkipButtons(previous, next) {
    if (previous) {
        previousButton.classList.remove("disabled");
    } else if (previous == false) {
        // Explicitly check false
        previousButton.classList.add("disabled");
    }
    if (next) {
        nextButton.classList.remove("disabled");
    } else if (next == false) {
        // Explicitly check false
        nextButton.classList.add("disabled");
    }
    return;
}

export function changeConnectionIdentifier(connected) {
    // connected boolean
    if (connected) {
        connectionStatusText.innerText = "Connected";
        connectionStatusText.classList.remove("text-warning");
        connectionStatusText.classList.add("text-success");
        connectionStatusSpinner.style.visibility = "hidden";
    } else {
        connectionStatusSpinner.style.visibility = "visible";
        connectionStatusText.innerText = "Reconnecting...";
        connectionStatusText.classList.remove("text-success");
        connectionStatusText.classList.add("text-warning");
    }
    return;
}

export function changeMainSpinner(state, message = "Loading data...") {
    switch (state) {
        case 0: // No loading, hide spinner
            mainSpinner.style.visibility = "hidden";
            break;
        case 1: // Connected, loading data
            mainSpinner.style.visibility = "visible";
            mainSpinnerText.innerText = message;
            break;
        case 2: // Connecting to server
            mainSpinner.style.visibility = "visible";
            mainSpinnerText.innerText = "Connecting...";
            break;
        default:
            break;
    }
    return;
}

export function changeThumbnailSpinner(visible) {
    if (visible) {
        changeThumbnailLoadingText(true);
        thumbnailSpinner.classList.remove("fadeOutDiv");
    } else {
        thumbnailSpinner.classList.add("fadeOutDiv");
    }
}

export function changeThumbnailLoadingText(waitingForServer) {
    if (waitingForServer) {
        thumbnailLoadingText.innerText = "Preloading new video..."
    } else {
        thumbnailLoadingText.innerText = "Loading thumbnail..."
    }
}

export function changeNewVideoButtonEnabled(enabled) {
    changeButtonEnabled(enabled, btnVideoPush);
}

export function changeAppendVideoButtonEnabled(enabled) {
    changeButtonEnabled(enabled, btnQueueAppend);
}

function changeButtonEnabled(enabled, button) {
    if (enabled) {
        button.removeAttribute("disabled");
    } else {
        button.setAttribute("disabled", "disabled");
    }
}

export function updateClientsTable(clients) {
    // Get a reference to the table, and empty it
    clientsTable.innerHTML = "";

    // console.log(clients);

    for (const [id, client] of Object.entries(clients)) {
        if (client.status.state == "Admin") {
            continue;
        }
        if (client.status.preloading) {
            clientsTable.innerHTML =
                clientsTable.innerHTML +
                "<tr><td>" +
                client._name +
                "</td><td><span class='text-warning'>" +
                stateIcons[client.status.state + 1] +
                "</span></td></tr>";
            continue;
        }
        clientsTable.innerHTML =
            clientsTable.innerHTML +
            "<tr><td>" +
            client._name +
            "</td><td>" +
            stateIcons[client.status.state + 1] +
            "</td></tr>";
    }
}

export function changeMainThumbnail(video) {
    if (video) {
        nowplayingThumbnail.src = getThumbnailSrc(video);
        nowplayingTitleElement.innerText = video.title;
        nowplayingChannelElement.innerText = video.channel;
    } else {
        nowplayingThumbnail.src = logo;
        nowplayingTitleElement.innerText = "There's nothing playing right now";
        nowplayingChannelElement.innerText = "Push a video to get started";
    }
}

export function changeUpNextThumbnail(video) {
    if (video) {
        upNextTitle.innerText = video.title;
        upNextImage.src = getMQThumbnailSrc(video);
    } else {
        upNextTitle.innerText = "There's nothing up next just yet.";
        upNextImage.removeAttribute("src");
    }
}

export function updateQueueFrontend(queue) {
    console.log(queue);
    // If there's a next video, change the up next thumbnail and enable the skip button
    if (queue.length > 0) {
        try {
            changeUpNextThumbnail(queue.videos[queue.index + 1]);
        } catch (error) {
            // If there's nothing up next, indicate this
            changeUpNextThumbnail();
        }
        changeSkipButtons(undefined, true);
    } else if (queue.length == 0) {
        changeSkipButtons(undefined, false);
        changeUpNextThumbnail(); // If the queue's empty then there's nothing up next, indicate this
    }
    // If there's a previous video, enable the previous button
    if (queue.index > 0) {
        changeSkipButtons(true, undefined);
    } else {
        changeSkipButtons(false, undefined);
    }

    const activeTableRow = document.querySelector("#playlist-table-body > tr.tr-active");
    const nextTableRow = document.getElementById("queue-table-video-" + (queue.index + 1));

    if (activeTableRow == null && nextTableRow != null && queue.length > 0) {
        nextTableRow.classList.add("tr-active");
    } else if (
        activeTableRow != null &&
        nextTableRow != null &&
        activeTableRow.id.substring(0, 18) != queue.index + 1
    ) {
        activeTableRow.classList.remove("tr-active");
        nextTableRow.classList.add("tr-active");
    }
}

export function updatePlaylistTableHTML(newHTML) {
    playlistTable.innerHTML = newHTML;
}

export function checkPlaylistShuffleBox(checked) {
    checkQueueShuffle.checked = checked;
}
