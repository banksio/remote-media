//This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player, iframe, vid;
var vid = 'pE49WK-oNjU';
var $ = document.querySelector.bind(document);

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
    // player.loadVideoById(vid);
    //$("player").keydown(false);
    player.cueVideoById(vid);
    muteVid();
}


// setTimeout(() => {
//     const interval = setInterval(function() {
//         socket.emit("playerBuffered", { buffered: player.getVideoLoadedFraction(), socketID: socket.id, state: player.getPlayerState() });
//     }, 5000);
// }, 1000);




socket.on('recieverPlayerControl',function(data){
    state = player.getPlayerState()
    switch (data){
        case "pause":
            if (state != 3 && state != -1){
                player.pauseVideo();
            }
            break
        case "play":
            player.playVideo();
            break
        case "mute":
            player.mute();
            break
        case "unmute":
            player.unMute();
            break
    }
})

// Preloading new videos
var preloading = false;

// When a new video comes in, mute the player and play the video
socket.on("serverNewVideo", function(data){
    console.log("Preloading..." + data.value);
    preloading = true;  // We are loading a new video
    console.log(preloading)
    socket.emit("serverPlayerStatus", { "state": undefined, "preloading": true });
    vid = data.value;
    player.mute();
    player.loadVideoById(vid);
});

function onPlayerStateChange(event) {
    
    newState = event.data;
    console.log(newState);
    if (preloading){  // If we're preloading
        document.title = "Remote Media";
        switch (newState){
            case 1:  // And the video is now playing
                // Update the tab title with the current Video ID
                document.title = player.getVideoData().title + " - Remote Media";
                preloadingNearlyDone();
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
    socket.emit("serverPlayerStatus", { "state": newState, "preloading": preloading });
}

function preloadingNearlyDone(){
    console.log("Nearly preloaded.");
    player.pauseVideo();  // Pause the video
    player.seekTo(0); // Go back to the start
    player.unMute();  // Unmute the video ready for playing
    preloading = false;
    console.log("Preloading done.");
    socket.emit("serverPlayerStatus", { "state": undefined, "preloading": false });
}

function preloadingDone(){

}

