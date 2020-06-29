//This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player, iframe, vid, state;
var vid = 'pE49WK-oNjU';
var $ = document.querySelector.bind(document);

var firstVideo = true;
// Preloading new videos
var preloading = false;

// This function creates an <iframe> (and YouTube player) after the API code downloads.
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        // playerVars: {'autoplay': 1, 'controls': 1, 'rel' : 0, 'fs' : 0},
        playerVars: { 'autoplay': 1, 'controls': 1, 'disablekb': 1, 'fs': 0 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

//The API will call this function when the video player is ready.
function onPlayerReady(event) {
    player = event.target;
    console.log("YouTube player ready.");

    //iframe = $('#player');
    // preloadVideo(vid);
    //$("player").keydown(false);
    // player.cueVideoById(vid);
    // muteVid();

    // Let the server know we're ready for some videos!
    socket.binary(false).emit("recieverPlayerReady");
    // alert("ready");
}

// socket.on("serverCurrentVideo", function (video) {
//     vid = video.id;
// });

// setTimeout(() => {
//     const interval = setInterval(function() {
//         socket.binary(false).emit("playerBuffered", { buffered: player.getVideoLoadedFraction(), socketID: socket.id, state: player.getPlayerState() });
//     }, 5000);
// }, 1000);



// Control the player when instructed by the server
socket.on('serverPlayerControl', function (data) {
    state = player.getPlayerState();
    switch (data) {
        case "pause":
            if (state != 3 && state != -1) {
                player.pauseVideo();
            }
            break;
        case "play":
            player.playVideo();
            frontendShowNotificationBanner("Playing", false);
            break;
        case "mute":
            player.mute();
            break;
        case "unmute":
            player.unMute();
            break;
    }
});



// When a new video comes in, preload the video
socket.on("serverNewVideo", function (data) {
    // if (firstVideo == false) {
    //     firstVideo = true;
    // }
    preloadVideo(data.value);
});

// Adjust the timestamp of the player to sync with the server
socket.on("serverVideoTimestamp", function (timestamp) {
    console.log("playingFirst" + timestamp);
    // firstVideo = false;
    skipToTimestamp(timestamp);
});

function skipToTimestamp(timestamp){
    player.playVideo();
    player.seekTo(timestamp);
}


function requestTimestampFromServer() {
    // Ask the server for the current timestamp
    socket.emit('recieverTimestampRequest', (timestamp) => { // args are sent in order to acknowledgement function
        // If they're more than 2 seconds apart, show the menu
        skipToTimestamp(timestamp);
    });
}

// Preloading new video once already played one video; mute the player and play the video
function preloadVideo(id) {
    console.log("Preloading..." + id);
    // Set preloading true, send to 
    preloading = true;
    socket.binary(false).emit("recieverPlayerStatus", { "state": state, "preloading": true });
    vid = id;
    player.mute();
    player.loadVideoById(vid);
}

// When the player's state changes
function onPlayerStateChange(event) {
    newState = event.data;
    console.log(newState);
    if (preloading) {  // If we're preloading
        document.title = "Remote Media";
        switch (newState) {
            case 1:  // And the video is now playing
                // Update the tab title with the current Video ID
                document.title = player.getVideoData().title + " - Remote Media";
                sendVideoDetails();  // Send the server the video details
                preloadFinisher();  // Finish preloading
                break;
            case 2:
                // preloadingDone();
                break;
            default:
                break;
        }
    } else {
        switch (newState) {
            case 0:
                document.title = "Remote Media";
                playScreensaver();
                break;
            case 1:
                // Update the tab title with the current Video ID
                document.title = player.getVideoData().title + " - Remote Media";
                // break; // Fall through to next case
            case 2:
                compareWithServerTimestamp();
        }
    }
    socket.binary(false).emit("playerinfo", { currentTime: player.getCurrentTime(), socketID: socket.id, state: newState });
    socket.binary(false).emit("recieverPlayerStatus", { "state": newState, "preloading": preloading, "firstVideo": firstVideo });
}

function preloadFinisher() {
    console.log("Nearly preloaded.");
    player.pauseVideo();  // Pause the video
    player.seekTo(0); // Go back to the start
    player.unMute();  // Unmute the video ready for playing
    preloading = false;
    console.log("Preloading done.");
    socket.binary(false).emit("recieverPlayerStatus", { "state": state, "preloading": false });
}

function compareWithServerTimestamp(){
    console.log("checking TS");
    // Ask the server for the current timestamp
    socket.emit('recieverTimestampRequest', (timestamp) => { // args are sent in order to acknowledgement function
        // If they're more than 2 seconds apart, show the menu
        if (compareTimestamps(player.getCurrentTime(), timestamp)){
            frontendShowSideControlPanel(true);
        } else {
            frontendShowSideControlPanel(false);
        }
    });
}

function compareTimestamps(client, server){
    console.log("CLIENT " + client);
    console.log("SERVER " + server);
    if (client > server + 2){
        return true;
    } else if (client < server - 2){
        return true;
    }
    return false;
}

function sendVideoDetails() {
    var videoDetails = player.getVideoData();
    var videoDuration = player.getDuration();
    console.log(videoDetails);
    socket.binary(false).emit("recieverVideoDetails", {
        id: videoDetails.video_id,
        title: videoDetails.title,
        channel: videoDetails.author,
        duration: videoDuration
    });
}

function playScreensaver() {
    document.getElementById("screensaver").classList.remove("fadeOutDiv");
    console.log("Hiding screensaver");
}