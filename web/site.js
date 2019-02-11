var socket = io.connect("192.168.1.240:8023");

var player, iframe, vid;
var $ = document.querySelector.bind(document);

// init player
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '200',
    width: '300',
    videoId: 'D3-vBBQKOYU',
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
    player.loadVideoById(vid, 5, "large");
    $("player").keydown(false);
}

socket.on("target",function(data){
    vid = data.value;
    player.loadVideoById(vid, 5, "large")
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


function send(){
    var val = document.getElementById("target").value;
    socket.emit("target",{value: val, pass: document.getElementById("password").value});
}