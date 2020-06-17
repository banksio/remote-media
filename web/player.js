//This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player, iframe, vid;
var vid = 'pE49WK-oNjU';
var $ = document.querySelector.bind(document);

var firstVideo = false;
// Preloading new videos
var preloading = false;

// This function creates an <iframe> (and YouTube player) after the API code downloads.
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        // playerVars: {'autoplay': 1, 'controls': 1, 'rel' : 0, 'fs' : 0},
        playerVars: {'autoplay': 1, 'controls': 1, 'disablekb': 1},
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

//The API will call this function when the video player is ready.
function onPlayerReady(event) {
    player = event.target;
    //iframe = $('#player');
    player.loadVideoById(vid);
    //$("player").keydown(false);
    // player.cueVideoById(vid);
    muteVid();
    // When a new video comes in,
    socket.emit("recieverPlayerReady");
}

socket.on("serverCurrentVideo", function(video){
    vid = video.id;
    if (player == undefined){
        return;
    }
    if (firstVideo == false){
        firstVideo = true;
        console.log("recieveDDDDD " + video.id);
        player.cueVideoById(video.id);
        console.log("recieveDDDDD " + video.elapsedTime);
        player.seekTo(video.elapsedTime);
    }
});

// setTimeout(() => {
//     const interval = setInterval(function() {
//         socket.emit("playerBuffered", { buffered: player.getVideoLoadedFraction(), socketID: socket.id, state: player.getPlayerState() });
//     }, 5000);
// }, 1000);



// Control the player when instructed by the server
socket.on('serverPlayerControl',function(data){
    state = player.getPlayerState();
    switch (data){
        case "pause":
            if (state != 3 && state != -1){
                player.pauseVideo();
            }
            break;
        case "play":
            player.playVideo();
            break;
        case "mute":
            player.mute();
            break;
        case "unmute":
            player.unMute();
            break;
    }
});



// When a new video comes in, mute the player and play the video
socket.on("serverNewVideo", function(data){
    if (firstVideo == false){
        firstVideo = true;
    }
    preloadVideo(data.value);
});


// Preloading new video once already played one video; mute the player and play the video
function preloadVideo(id){
    console.log("Preloading..." + id);
    preloading = true;  // We are loading a new video
    console.log(preloading);
    socket.emit("recieverPlayerStatus", { "state": undefined, "preloading": true });
    vid = id;
    player.mute();
    player.loadVideoById(vid);
}

// When the player's state changes
function onPlayerStateChange(event) {
    newState = event.data;
    console.log(newState);
    if (preloading){  // If we're preloading
        document.title = "Remote Media";
        switch (newState){
            case 1:  // And the video is now playing
                // Update the tab title with the current Video ID
                document.title = player.getVideoData().title + " - Remote Media";
                sendVideoDetails();
                preloadFinisher();
                break;
            case 2:
                // preloadingDone();
                break;
            default:
                break;
        }
    } else {
        switch (newState){
            case 0:
                document.title = "Remote Media";
                break;
            case 1:
                // Update the tab title with the current Video ID
                document.title = player.getVideoData().title + " - Remote Media";
                break;
        }
    }
    socket.emit("playerinfo", { currentTime: player.getCurrentTime(), socketID: socket.id, state: newState });
    socket.emit("recieverPlayerStatus", { "state": newState, "preloading": preloading });
}

function preloadFinisher(){
    console.log("Nearly preloaded.");
    player.pauseVideo();  // Pause the video
    player.seekTo(0); // Go back to the start
    player.unMute();  // Unmute the video ready for playing
    preloading = false;
    console.log("Preloading done.");
    socket.emit("recieverPlayerStatus", { "state": undefined, "preloading": false });
}

function preloadingDone(){

}

function sendVideoDetails(){
    var videoDetails = player.getVideoData();
    console.log(videoDetails);
    socket.emit("recieverVideoDetails", {
        id: videoDetails.video_id,
        title: videoDetails.title,
        channel: videoDetails.author
    });
}