var url = window.location.href;
var arr = url.split("/");
var result = arr[0] + "//" + arr[2]
var socket = io.connect(result + "/");

//page elements
var volSlider = document.getElementById("volume");
var btnPlaylistShuffleToggle = document.getElementById('btnPlaylistShuffle');

var pause = document.getElementById('pause');
pause.addEventListener("click", function() {
    socket.emit("playerControl", "pause");
})
var play = document.getElementById('play');
play.addEventListener("click", function() {
    socket.emit("playerControl", "play");
})

var prev = document.getElementById('prev');
prev.addEventListener("click", function() {
    socket.emit("serverQueueControl", "prev");
})
var skip = document.getElementById('skip');
skip.addEventListener("click", function() {
    socket.emit("serverQueueControl", "skip");
})

var emptyPlaylist = document.getElementById('emptyPlaylist');
emptyPlaylist.addEventListener("click", function() {
    socket.emit("serverQueueControl", "empty");
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
    socket.emit("siteCon","reload");
 }
 
function disconnectClients(){
    socket.emit("siteCon","discon");
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
    // Get a reference to the table
    let tableRef = document.getElementById("data-table-body");
    tableRef.innerHTML = "";

    for (var obj in data){
        tableRef.innerHTML = tableRef.innerHTML + '<tr><td>'+ obj +'</td><td>'+ data[obj].state +'</td><td>'+ data[obj].preloading +'</td></tr>';
    }
})

socket.on("playlistInfoObj",function(playlist){
    $('#playlist-table-body tr').empty();
    var i = 1;
    for (var video of playlist){
        console.log(video);
        $('#playlist-table-body tr:last').after('<tr><td>'+ i +'</td><td>'+ video["id"] +'</td></tr>');
        i++;
    }
})

function toggleShuffle(toggled){
    var newState = (toggled == 'false');  // Invert boolean from DOM
    socket.emit("serverQueueControl", "toggleShuffle")
}

socket.on("playlistStatus", function(status) {
    if (status.shuffle){
        btnPlaylistShuffleToggle.classList.add("active");
    } else {
        btnPlaylistShuffleToggle.classList.remove("active");
    }
    btnPlaylistShuffleToggle.ariaPressed = status.shuffle;
})