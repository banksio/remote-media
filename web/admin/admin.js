var url = window.location.href;
var arr = url.split("/");
var result = arr[0] + "//" + arr[2]
var socket = io.connect(result + "/");

//page elements
var volSlider = document.getElementById("volume");

var pause = document.getElementById('pause');
pause.addEventListener("click", function() {
    socket.emit("playerControl", "pause");
})
var play = document.getElementById('play');
play.addEventListener("click", function() {
    socket.emit("playerControl", "play");
})

// Not currently used
// var mute = document.getElementById('1mute');
// mute.addEventListener("click", function() {
//   socket.emit("playerControl", "mute");
// })
// var unmute = document.getElementById('unmute');
// unmute.addEventListener("click", function() {
//   socket.emit("playerControl", "unmute");
// })

function send(){
    var val = document.getElementById("target").value;
    socket.emit("target",{value: val, pass: document.getElementById("password").value});
}

function sendAppend(){
    var val = document.getElementById("targetAppend").value;
    socket.emit("targetAppend",{value: val, pass: document.getElementById("password").value});
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
 
 function vol(){
    socket.emit('volumeSend',volSlider.value);
 }
 
 function reloadClients(){
     socket.broadcast.emit('site',"reload");
 }
 
function disconnectClients(){
    socket.broadcast.emit('site',"discon");
}
 
socket.on("volumeRecv",function(data){
    volSlider.value = data;
    output.innerHTML = data;
})
 
function muteVid(){
    player.setVolume(0);
}
 
function speak(){
    var val = document.getElementById("speechBox").value;
    socket.emit("speak",{value: val, pass: document.getElementById("password").value});
}
    
socket.on("playerinfo",function(data){
    $('#data-table tr:last').after('<tr><td>'+ data.socketID  +'</td><td>'+ data.currentTime +'</td><td>'+ data.state +'</td></tr>');
})

socket.on("playerInfoObj",function(data){
    $('#data-table-body tr').empty();
    for (var obj in data){
        $('#data-table-body tr:last').after('<tr><td>'+ obj +'</td><td>'+ data[obj].state +'</td><td>'+ data[obj].preloading +'</td></tr>');
    }
})