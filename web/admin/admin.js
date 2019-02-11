var socket = io.connect("192.168.1.240:8023");

socket.on("target",function(data){
  //alert("change");
    
})

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
    document.getElementById("thumbnail").src="https://img.youtube.com/vi/"+ val +"/hqdefault.jpg";
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