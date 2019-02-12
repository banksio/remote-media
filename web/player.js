//This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player, iframe, vid;
var vid = 'LH4Y1ZUUx2g';
var $ = document.querySelector.bind(document);

// This function creates an <iframe> (and YouTube player) after the API code downloads.
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        playerVars: { 'autoplay': 1, 'controls': 0, 'rel' : 0, 'fs' : 0},
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
    player.loadVideoById(vid);
    muteVid();
}

function onPlayerStateChange(event) {
    socket.emit("playerinfo", { currentTime: player.getCurrentTime(), socketID: socket.id, state: player.getPlayerState() });
}

socket.on("target",function(data){
    vid = data.value;
    player.loadVideoById(vid)
})

socket.on("playerControlRecv",function(data){
    switch (data){
        case "pause":
            player.pauseVideo();
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

