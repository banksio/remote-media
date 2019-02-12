var player, iframe, vid;
var vid = 'D3-vBBQKOYU';
var $ = document.querySelector.bind(document);

// init player
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    playerVars: { 'autoplay': 1, 'controls': 0, 'rel' : 0, 'fs' : 0},
    events: {
      'onReady': onPlayerReady
    }
  });
}

// when ready, wait for clicks
function onPlayerReady(event) {
    var player = event.target;
    iframe = $('#player');
    // player.loadVideoById(vid);
    $("player").keydown(false);
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

socket.on("volumeRecv",function(data){
    player.setVolume(data);
})