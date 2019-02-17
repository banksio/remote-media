var socket = io.connect("https://remotemedia-badmanbanks.c9users.io");

var volSlider = document.getElementById("volume");

var pause = document.getElementById('pause');
pause.addEventListener("click", function() {
  socket.emit("playerControl", "pause");
  $('#data-table-body').html('');
})
var play = document.getElementById('play');
play.addEventListener("click", function() {
  socket.emit("playerControl", "play");
  $('#data-table-body').html('');
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
 
 function reloadClients(){
     socket.emit("site","reload");
 }
 
function disconnectClients(){
    socket.emit('site');
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
    //alert(val);
    //document.getElementById("thumbnail").src="https://img.youtube.com/vi/"+ val +"/hqdefault.jpg";
    socket.emit("speak",{value: val, pass: document.getElementById("password").value});
}
    
socket.on("playerinfo",function(data){
    $('#data-table tr:last').after('<tr><td>'+ data.socketID  +'</td><td>'+ data.currentTime +'</td><td>'+ data.state +'</td></tr>');
})


//for each element that is classed as 'pull-down', set its margin-top to the difference between its own height and the height of its parent
$('.pull-down').each(function() {
  var $this = $(this);
  $this.css('margin-top', $this.parent().height() - $this.height())
});