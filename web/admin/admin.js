var url = window.location.href;
var arr = url.split("/");
var result = arr[0] + "//" + arr[2];
var socket = io(result + "/");

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

var pause = document.getElementById('pause');
pause.addEventListener("click", function () {
    socket.emit("adminPlayerControl", "pause");
});
var play = document.getElementById('play');
play.addEventListener("click", function () {
    socket.emit("adminPlayerControl", "play");
});

var prev = document.getElementById('prev');
prev.addEventListener("click", function () {
    socket.emit("adminQueueControl", "prev");
});
var skip = document.getElementById('skip');
skip.addEventListener("click", function () {
    socket.emit("adminQueueControl", "skip");
});

var emptyPlaylist = document.getElementById('emptyPlaylist');
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
    var val = document.getElementById("target").value;
    socket.emit("adminNewVideo", { value: val, pass: true });
}

function sendAppend() {
    var val = document.getElementById("targetAppend").value;
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
    //         socket.emit("targetAppend",{value: match, pass: document.getElementById("password").value});
    //     });
    // }
    socket.emit("targetAppend", { value: val, pass: document.getElementById("password").value });
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

// socket.on("serverNewVideo", function(data){
//     console.log("Preloading..." + data.value);
//     preloading = true;  // We are loading a new video
//     console.log(preloading)
//     socket.emit("recieverPlayerStatus", { "state": undefined, "preloading": true });
//     vid = data.value;
//     player.mute();
//     player.loadVideoById(vid);
// });

socket.on("serverClients", function (clients) {
    // Get a reference to the table, and empty it
    let tableRef = document.getElementById("data-table-body");
    tableRef.innerHTML = "";

    console.log(clients);

    for (let [id, client] of Object.entries(clients)) {
        if (client.status.state == "Admin") {
            continue;
        }
        if (client.status.preloading){
            tableRef.innerHTML = tableRef.innerHTML + '<tr><td>' + client.name + '</td><td><span class=\'text-warning\'>' + stateIcons[client.status.state + 1] + '</span></td></tr>';
            continue;
        }
        tableRef.innerHTML = tableRef.innerHTML + '<tr><td>' + client.name + '</td><td>' + stateIcons[client.status.state + 1] + '</td></tr>';
    }
});

socket.on("playlistInfoObj", function (playlist) {
    // Get a reference to the table, and empty it
    let tableRef = document.getElementById("playlist-table-body");
    tableRef.innerHTML = "";

    var i = 1;
    for (var video of playlist) {
        console.log(video);
        // $('#playlist-table-body tr:last').after('<tr><td>'+ i +'</td><td>'+ video["id"] +'</td></tr>');
        tableRef.innerHTML = tableRef.innerHTML + '<tr><td>' + i + '</td><td>' + video.id + '</td></tr>';
        i++;
    }
});

socket.on("serverQueueVideos", function (queueData) {
    // Get a reference to the table, and empty it
    let tableRef = document.getElementById("playlist-table-body");
    tableRef.innerHTML = "";
    console.log(queueData);
    var videos = queueData.videos;
    if (videos.length > 0) {
        var i = 1;
        for (var video of videos) {
            console.log(video);
            var videoID = video.id;
            // $('#playlist-table-body tr:last').after('<tr><td>'+ i +'</td><td>'+ video["id"] +'</td></tr>');
            tableRef.innerHTML = tableRef.innerHTML + '<tr><td>' + i + '</td><td>' + videoID + '</td></tr>';
            i++;
        }
    }

    queueUpdateStatus(queueData);
});

function toggleShuffle(toggled) {
    var newState = (toggled == 'false');  // Invert boolean from DOM
    socket.emit("adminQueueControl", "toggleShuffle");
}

socket.on("serverQueueStatus", function (status) {
    queueUpdateStatus(status);
});

function queueUpdateStatus(status) {

    if (status.shuffle) {
        btnPlaylistShuffleToggle.classList.add("active");
    } else {
        btnPlaylistShuffleToggle.classList.remove("active");
    }
    btnPlaylistShuffleToggle.ariaPressed = status.shuffle;
}

socket.on('initFinished', function () {
    frontendChangeMainSpinner(0);
});

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