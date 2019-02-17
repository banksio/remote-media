var socket = io.connect("https://remotemedia-badmanbanks.c9users.io");

socket.on("volumeRecv",function(data){
    player.setVolume(data);
})

 function muteVid(){
    console.log("Not an admin panel.");
 }
 
 socket.on("reload", function(){
    location.reload(); 
 })

socket.on("exit",function(){
    socket.disconnect();
})
socket.on("speechRecv", function (data) {
    var msg = new SpeechSynthesisUtterance(data);
    window.speechSynthesis.speak(msg);
})