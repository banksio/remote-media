var socket = io.connect("https://remotemedia.azurewebsites.net");

 function muteVid(){
    console.log("Not an admin panel.");
 }
 
socket.on('site', function(data){
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
 
socket.on("speechRecv", function (data) {
    var msg = new SpeechSynthesisUtterance(data);
    window.speechSynthesis.speak(msg);
})

socket.on('volumeRecv',function(data){
    player.setVolume(data);
})