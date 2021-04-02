var url = window.location.href;
var arr = url.split("/");
var result = arr[0] + "//" + arr[2];
var socket = io(result + "/");

const stateIcons = [
    '<i class="fas fa-hourglass-half"></i>',
    '<i class="fas fa-stop"></i>',
    '<i class="fas fa-play"></i>',
    '<i class="fas fa-pause"></i>',
    '<div class="spinner-border spinner-border-sm"></div>',
    'Unknown',
    '<i class="fas fa-check"></i>'
];

const tableWorker = new Worker('js/worker.js');

// Page elements
const volSlider = document.getElementById("volume");
const btnPlaylistShuffleToggle = document.getElementById('btnPlaylistShuffle');
const checkQueueShuffle = document.getElementById('shuffleCheck');
const pause = document.getElementById('pause');
const play = document.getElementById('play');
const prev = document.getElementById('prev');
const skip = document.getElementById('skip');
const emptyPlaylist = document.getElementById('emptyPlaylist');
const btnQueueAppend = document.querySelector("#queue > div.input-group > div > button");
const btnVideoPush = document.querySelector("#quickpush > div > div > button");
const tableRef = document.getElementById("playlist-table-body");
const upNextTitle = document.getElementById("videoTitleNext");
const upNextImage = document.getElementById("videoThumbnailNext");
const nowplayingTitleElement = document.getElementById("nowPlayingTitle");
const nowplayingChannelElement = document.getElementById("nowPlayingChannel");
const nowplayingThumbnail = document.getElementById("imgNowPlaying");

const queue = {
    "index": 0,
    "shuffle": false,
    "videos": []
};

// If the thumbnail is the default YouTube invalid thumbnail, get the lower resolution
nowplayingThumbnail.onload = () => {
    if (nowplayingThumbnail.naturalHeight === 90) {
        nowplayingThumbnail.src = nowplayingThumbnail.src.slice(0,-17) + "hqdefault.jpg";
    }
}

socket.on('connect', () => {
    console.log(socket.id);
    // alert(socket.id);
    frontendChangeConnectionIdentifier(true);
    frontendChangeMainSpinner(1);
});

socket.on('disconnect', () => {
    console.log(socket.id);
    // alert("disconnected");
    frontendChangeConnectionIdentifier(false);
});


pause.addEventListener("click", function () {
    socket.emit("adminPlayerControl", "pause");
});
play.addEventListener("click", function () {
    socket.emit("adminPlayerControl", "play");
});
prev.addEventListener("click", function () {
    socket.emit("adminQueueControl", "prev");
});
skip.addEventListener("click", function () {
    socket.emit("adminQueueControl", "skip");
});
emptyPlaylist.addEventListener("click", function () {
    socket.emit("adminQueueControl", "empty");
});

// Not currently used
// var mute = document.getElementById('1mute');
// mute.addEventListener("click", function() {
//   socket.emit("playerControl", "mute");
// })
// var unmute = document.getElementById('unmute');
// unmute.addEventListener("click", function() {
//   socket.emit("playerControl", "unmute");
// })

function send() {
    btnVideoPush.setAttribute("disabled", "disabled");
    frontendChangeMainSpinner(1, "Pushing video...");
    var val = document.getElementById("target").value;
    socket.emit("adminNewVideo", { value: val, pass: true });
}


function sendAppend(data) {
    btnQueueAppend.setAttribute("disabled", "disabled");
    frontendChangeMainSpinner(1, "Adding to queue...");
    socket.emit("adminQueueAppend", { value: data });
}


function getTitle(data) {
    var feed = data.feed;
    var entries = feed.entry || [];
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var title = entry.title.$t;
        console.log(title);
    }
}

function vol() {
    socket.emit('volumeSend', volSlider.value);
}

function reloadClients() {
    socket.emit("adminConnectionManagement", "reload");
}

function disconnectClients() {
    socket.emit("adminConnectionManagement", "discon");
}

socket.on("volumeRecv", function (data) {
    volSlider.value = data;
    output.innerHTML = data;
});

function muteVid() {
    player.setVolume(0);
}

function speak() {
    var val = document.getElementById("speechBox").value;
    socket.emit("adminTTSRequest", { value: val, pass: document.getElementById("password").value });
}

// socket.on("playerinfo",function(data){
//     $('#data-table tr:last').after('<tr><td>'+ data.socketID  +'</td><td>'+ data.currentTime +'</td><td>'+ data.state +'</td></tr>');
// })

// New video send to clients
socket.on("serverNewVideo", function (data) {
    // Show loading of thumbnail
    frontendChangeThumbnailSpinner(true);
    btnVideoPush.removeAttribute("disabled");
    frontendChangeMainSpinner(0);
});

// Recieved video details from the server
socket.on("serverCurrentVideo", function (video) {
    video = JSON.parse(video);
    console.log("Recieved video details from server");
    // console.log(JSON.parse(video));
    changeMainThumbnail(video);
    frontendChangeThumbnailSpinner(false);
    // console.log(videoDetails);
});

socket.on("serverClients", function (clients) {
    // Get a reference to the table, and empty it
    let tableRef = document.getElementById("data-table-body");
    tableRef.innerHTML = "";

    // console.log(clients);

    for (let [id, client] of Object.entries(clients)) {
        if (client.status.state == "Admin") {
            continue;
        }
        if (client.status.preloading) {
            tableRef.innerHTML = tableRef.innerHTML + '<tr><td>' + client._name + '</td><td><span class=\'text-warning\'>' + stateIcons[client.status.state + 1] + '</span></td></tr>';
            continue;
        }
        tableRef.innerHTML = tableRef.innerHTML + '<tr><td>' + client._name + '</td><td>' + stateIcons[client.status.state + 1] + '</td></tr>';
    }
});

socket.on("serverQueueVideos", function (queueData) {
    frontendChangeMainSpinner(1, "Updating queue...");
    queue.videos = queueData.videos;
    queue.index = queueData.index;
    queue.length = queueData.length;

    // Repopulate the table
    repopulateQueueTable();
    // Update the "next up" indicator
    updateQueueFrontend();

    // queueUpdateStatus(queueData);
});

function repopulateQueueTable() {
    tableWorker.postMessage(queue);
}

tableWorker.onmessage = function(e) {
    tableRef.innerHTML = e.data;
    console.log('Message received from worker');
    btnQueueAppend.removeAttribute("disabled");
    frontendChangeMainSpinner(0);
}

function updateQueueFrontend() {
    if (queue.videos.length > 0){
        try {
            changeUpNextThumbnail(queue.videos[queue.index + 1]);
        }
        catch (error) { // If there's nothing up next, indicate this
            changeUpNextThumbnail();
        }

        frontendChangeSkipButtons(undefined, true);
        if (queue.index > 0) {
            frontendChangeSkipButtons(true, undefined);
        }
        else {
            frontendChangeSkipButtons(false, undefined);
        }
    } else if (queue.videos.length == 0){
        frontendChangeSkipButtons(false, false);
        changeUpNextThumbnail();  // If the queue's empty then there's nothing up next, indicate this
    }
}

function changeMainThumbnail(video) {
    if (video){
        nowplayingThumbnail.src = getThumbnailSrc(video);
        nowplayingTitleElement.innerText = video.title;
        nowplayingChannelElement.innerText = video.channel;
    } else {
        nowplayingThumbnail.src = "branding/logo.png";
        nowplayingTitleElement.innerText = "There's nothing playing right now";
        nowplayingChannelElement.innerText = "Push a video to get started";
    }
}

function changeUpNextThumbnail(video){
    if (video){
        upNextTitle.innerText = video.title;
        upNextImage.src = getMQThumbnailSrc(video);
    } else {
        upNextTitle.innerText = "There's nothing up next just yet.";
        upNextImage.removeAttribute("src");
    }

}

function getThumbnailSrc(video) {
    return "https://i3.ytimg.com/vi/" + video.id + "/maxresdefault.jpg";
}

function getMQThumbnailSrc(video) {
    return "https://i3.ytimg.com/vi/" + video.id + "/mqdefault.jpg";
}

function toggleShuffle(toggled) {
    frontendChangeMainSpinner(1, "Shuffling queue...");
    var newState = (toggled == 'false');  // Invert boolean from DOM
    socket.emit("adminQueueControl", "toggleShuffle");
}

socket.on("serverQueueStatus", function (status) {
    queueUpdateStatus(status);
});

socket.on("serverQueueFinished", function () {
    changeMainThumbnail();
})

function queueUpdateStatus(status) {
    // Update the status
    queue.shuffle = status.shuffle;
    queue.index = status.index;
    queue.length = status.length;

    if (status.shuffle == true) {
        checkQueueShuffle.checked = true;
    } else {
        checkQueueShuffle.checked = false;
    }

    let activeTableRow = document.querySelector("#playlist-table-body > tr.tr-active");
    let nextTableRow = document.getElementById("queue-table-video-" + (queue.index + 1));

    if (activeTableRow == null && queue.length > 0) {
        nextTableRow.classList.add("tr-active");
    } else if (activeTableRow != null && activeTableRow.id.substring(0, 18) != (queue.index + 1)) {
        activeTableRow.classList.remove("tr-active");
        nextTableRow.classList.add("tr-active");
    }
    updateQueueFrontend();

}

socket.on("initFinished", function () {
    frontendChangeMainSpinner(0);
});

function frontendChangeSkipButtons(previous, next) {
    let frontendElementPrev = document.getElementById("prev");
    let frontendElementNext = document.getElementById("skip");
    //connected boolean
    if (previous == true) {
        frontendElementPrev.classList.remove("disabled");
    } else if (previous == false) {
        frontendElementPrev.classList.add("disabled");
    }
    if (next == true) {
        frontendElementNext.classList.remove("disabled");
    } else if (next == false) {
        frontendElementNext.classList.add("disabled");
    }
    return;
}

function frontendChangeConnectionIdentifier(connected) {
    let frontendElementConnectedStatus = document.getElementById("statusConnection");
    let frontendElementConnectedSpinner = document.getElementById("spinnerConnection");
    //connected boolean
    if (connected) {
        frontendElementConnectedStatus.innerText = "Connected";
        frontendElementConnectedStatus.classList.remove("text-warning");
        frontendElementConnectedStatus.classList.add("text-success");
        frontendElementConnectedSpinner.style.visibility = "hidden";
    } else {
        frontendElementConnectedSpinner.style.visibility = "visible";
        frontendElementConnectedStatus.innerText = "Reconnecting...";
        frontendElementConnectedStatus.classList.remove("text-success");
        frontendElementConnectedStatus.classList.add("text-warning");
    }
    return;
}

function frontendChangeMainSpinner(state, message="Loading data...") {
    let frontendElementMainSpinner = document.getElementById("statusSpinner");
    let frontendElementMainSpinnerText = document.getElementById("statusLoading");
    switch (state) {
        case 0:  // No loading, hide spinner
            frontendElementMainSpinner.style.visibility = 'hidden';
            break;
        case 1:  // Connected, loading data
            frontendElementMainSpinner.style.visibility = 'visible';
            frontendElementMainSpinnerText.innerText = message;
            break;
        case 2:  // Connecting to server
            frontendElementMainSpinner.style.visibility = 'visible';
            frontendElementMainSpinnerText.innerText = "Connecting...";
            break;
        default:
            break;
    }
    return;
}

function frontendChangeThumbnailSpinner(visible) {
    let frontendElementThumbnailSpinner = document.querySelector("div.nowPlayingContainer > div");
    if (visible) {
        frontendElementThumbnailSpinner.classList.remove("fadeOutDiv");
    } else {
        frontendElementThumbnailSpinner.classList.add("fadeOutDiv");
    }
}