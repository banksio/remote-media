var url = window.location.href;
var arr = url.split("/");
var result = arr[0] + "//" + arr[2];
var socket = io(result + "/");

const btnQueueAppend = document.querySelector("#queue > div.input-group > div > button");
const btnVideoPush = document.querySelector("#quickpush > div > div > button");
const tableRef = document.getElementById("playlist-table-body");
const upNextTitle = document.getElementById("videoTitleNext");
const upNextImage = document.getElementById("videoThumbnailNext");
const nowplayingTitleElement = document.getElementById("nowPlayingTitle");
const nowplayingChannelElement = document.getElementById("nowPlayingChannel");
const nowplayingThumbnail = document.getElementById("imgNowPlaying");

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

const stateIcons = [
    '<i class="fas fa-hourglass-half"></i>',
    '<i class="fas fa-stop"></i>',
    '<i class="fas fa-play"></i>',
    '<i class="fas fa-pause"></i>',
    '<div class="spinner-border spinner-border-sm"></div>',
    'Unknown',
    '<i class="fas fa-check"></i>'
];

//page elements
var volSlider = document.getElementById("volume");
var btnPlaylistShuffleToggle = document.getElementById('btnPlaylistShuffle');
var checkQueueShuffle = document.getElementById('shuffleCheck');

var pause = document.getElementById('pause');
pause.addEventListener("click", function () {
    socket.binary(false).emit("adminPlayerControl", "pause");
});
var play = document.getElementById('play');
play.addEventListener("click", function () {
    socket.binary(false).emit("adminPlayerControl", "play");
});

var prev = document.getElementById('prev');
prev.addEventListener("click", function () {
    socket.binary(false).emit("adminQueueControl", "prev");
});
var skip = document.getElementById('skip');
skip.addEventListener("click", function () {
    socket.binary(false).emit("adminQueueControl", "skip");
});

var emptyPlaylist = document.getElementById('emptyPlaylist');
emptyPlaylist.addEventListener("click", function () {
    socket.binary(false).emit("adminQueueControl", "empty");
});

// Not currently used
// var mute = document.getElementById('1mute');
// mute.addEventListener("click", function() {
//   socket.binary(false).emit("playerControl", "mute");
// })
// var unmute = document.getElementById('unmute');
// unmute.addEventListener("click", function() {
//   socket.binary(false).emit("playerControl", "unmute");
// })

function send() {
    var val = document.getElementById("target").value;
    socket.binary(false).emit("adminNewVideo", { value: val, pass: true });
}


function sendAppend(data) {
    // var val = document.getElementById("targetAppend").value;
    // alert(data);
    // var id = undefined;

    // const regex = /(?:\.be\/(.*?)(?:\?|$)|watch\?v=(.*?)(?:\&|$|\n))/ig;
    // let m;

    // while ((m = regex.exec(val)) !== null) {
    //     // This is necessary to avoid infinite loops with zero-width matches
    //     if (m.index === regex.lastIndex) {
    //         regex.lastIndex++;
    //     }

    //     // The result can be accessed through the `m`-variable.
    //     m.forEach((match, groupIndex) => {
    //         if (groupIndex == 0){
    //             return;
    //         }
    //         if (match == undefined){
    //             return;
    //         }
    //         // console.log(`Found match, group ${groupIndex}: ${match}`);
    //         socket.binary(false).emit("targetAppend",{value: match, pass: document.getElementById("password").value});
    //     });
    // }
    socket.binary(false).emit("adminQueueAppend", { value: data });
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
    socket.binary(false).emit('volumeSend', volSlider.value);
}

function reloadClients() {
    socket.binary(false).emit("adminConnectionManagement", "reload");
}

function disconnectClients() {
    socket.binary(false).emit("adminConnectionManagement", "discon");
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
    socket.binary(false).emit("adminTTSRequest", { value: val, pass: document.getElementById("password").value });
}

// socket.on("playerinfo",function(data){
//     $('#data-table tr:last').after('<tr><td>'+ data.socketID  +'</td><td>'+ data.currentTime +'</td><td>'+ data.state +'</td></tr>');
// })

// New video send to clients
socket.on("serverNewVideo", function (data) {
    // Show loading of thumbnail
    frontendChangeThumbnailSpinner(true);
});

// Recieved video details from the server
socket.on("serverCurrentVideo", function (video) {
    video = JSON.parse(video);
    console.log("Recieved video details from server");
    // console.log(JSON.parse(video));
    nowplayingThumbnail.src = getThumbnailSrc(video);
    nowplayingTitleElement.innerText = video.title;
    nowplayingChannelElement.innerText = video.channel;
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
    // alert("oof");
    // prompt("queue", JSON.stringify(queueData));
    // queueData = JSON.parse(queueData);
    // return;
    // Empty the table
    tableRef.innerHTML = "";
    // console.log(queueData);
    var videos = queueData.videos;
    if (videos.length > 0) {
        var i = 1;
        for (var video of videos) {
            // prompt("", video);
            // console.log(video);
            var videoID = video.id;
            // $('#playlist-table-body tr:last').after('<tr><td>'+ i +'</td><td>'+ video["id"] +'</td></tr>');
            if (i == queueData.index + 1){
                tableRef.innerHTML = tableRef.innerHTML + '<tr class="tr-active"><td>' + i + '</td><td>' + video.title + '</td><td>' + video.channel + '</td></tr>';
            } else {
                tableRef.innerHTML = tableRef.innerHTML + '<tr><td>' + i + '</td><td>' + video.title + '</td><td>' + video.channel + '</td></tr>';
            }
            
            i++;
        }
        // Update the "next up" indicator
        try {
            upNextTitle.innerText = videos[queueData.index + 1].title;
            upNextImage.src = getMQThumbnailSrc(videos[queueData.index + 1]);
        } catch (error) {  // If there's nothing up next, indicate this
            upNextTitle.innerText = "There's nothing up next just yet.";
            upNextImage.removeAttribute("src");
        }
    }

    if (videos.length > 0){
        frontendChangeSkipButtons(undefined, true);
        if (queueData.index > 0) {
            frontendChangeSkipButtons(true, undefined);
        } else {
            frontendChangeSkipButtons(false, undefined);
        }
    } else if (videos.length == 0){
        frontendChangeSkipButtons(false, false);
    }

    // queueUpdateStatus(queueData);
});

function getThumbnailSrc(video) {
    return "https://i3.ytimg.com/vi/" + video.id + "/maxresdefault.jpg";
}

function getMQThumbnailSrc(video) {
    return "https://i3.ytimg.com/vi/" + video.id + "/mqdefault.jpg";
}

function toggleShuffle(toggled) {
    var newState = (toggled == 'false');  // Invert boolean from DOM
    socket.binary(false).emit("adminQueueControl", "toggleShuffle");
}

socket.on("serverQueueStatus", function (status) {
    queueUpdateStatus(status);
});

function queueUpdateStatus(status) {
    // alert(status);
    // alert(JSON.stringify(status))
    if (status.shuffle == true) {
        checkQueueShuffle.checked = true;
    } else {
        checkQueueShuffle.checked = false;
    }
}

// // the client code
// socket.on('ferret', (name, fn) => {
//     fn('woot');
// });

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

function frontendChangeMainSpinner(state) {
    let frontendElementMainSpinner = document.getElementById("statusSpinner");
    let frontendElementMainSpinnerText = document.getElementById("statusLoading");
    switch (state) {
        case 0:  // No loading, hide spinner
            frontendElementMainSpinner.style.visibility = 'hidden';
            break;
        case 1:  // Connected, loading data
            frontendElementMainSpinner.style.visibility = 'visible';
            frontendElementMainSpinnerText.innerText = "Loading data...";
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