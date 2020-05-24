var url = window.location.href;
var arr = url.split("/");
var result = arr[0] + "//" + arr[2]
var socket = io.connect(result + "/");

 function muteVid(){
    console.log("Not an admin panel.");
 }
 
socket.on("recieverConnectionManagement", function(data){
    console.log("Site" + data);
    switch (data){
        case "reload":
            location.reload();
            break;
        case "discon":
            socket.disconnect();
            break;
        default:
            console.log("Unknown site command.");
    }
})
 
socket.on("recieverTTSSpeak", function (data) {
    var msg = new SpeechSynthesisUtterance(data);
    window.speechSynthesis.speak(msg);
})

socket.on('volumeRecv',function(data){
    player.setVolume(data);
})