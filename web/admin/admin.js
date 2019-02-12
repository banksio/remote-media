var socket = io.connect("https://remotemedia-badmanbanks.c9users.io");

var volSlider = document.getElementById("volume");

var pause = document.getElementById('pause');
pause.addEventListener("click", function() {
  socket.emit("playerControl", "pause");
})
var play = document.getElementById('play');
play.addEventListener("click", function() {
  socket.emit("playerControl", "play");
})
var mute = document.getElementById('1mute');
mute.addEventListener("click", function() {
  socket.emit("playerControl", "mute");
})
var unmute = document.getElementById('unmute');
unmute.addEventListener("click", function() {
  socket.emit("playerControl", "unmute");
})

function send(){
    var val = document.getElementById("target").value;
    //alert(val);
    //document.getElementById("thumbnail").src="https://img.youtube.com/vi/"+ val +"/hqdefault.jpg";
    socket.emit("target",{value: val, pass: document.getElementById("password").value});
    //alert(val);
    //alert(val);
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
    socket.emit("volume",volSlider.value)
 }
 
 socket.on("volumeRecv",function(data){
    volSlider.value = data;
    output.innerHTML = volSlider.value;
})
 
 function muteVid(){
    player.setVolume(0);
 }
 
 function loadTable(tableId, fields, data) {
        var rows = '';
        $.each(data, function(index, item) {
            var row = '<tr>';
            $.each(fields, function(index, field) {
                row += '<td>' + item[field+''] + '</td>';
            });
            rows += row + '<tr>';
        });
        $('#' + tableId + ' tbody').html(rows);
    }
    
socket.on("playerinfo",function(data){
    loadTable('data-table', [currentTime, socketID, state], data);

})