var url = window.location.href;
var arr = url.split("/");
var result = arr[0] + "//" + arr[2];
var socket = io(result + "/");

socket.on('connect', () => {
    console.log(socket.id);
    frontendChangeConnectionIdentifier(true);
});

socket.on('disconnect', () => {
    console.log(socket.id);
    frontendChangeConnectionIdentifier(false);
});

// let name = prompt("Enter a name: ");
// socket.emit("serverRecieverConnected", name);

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
});
 
socket.on("recieverTTSSpeak", function (data) {
    var msg = new SpeechSynthesisUtterance(data);
    window.speechSynthesis.speak(msg);
});

socket.on('volumeRecv',function(data){
    player.setVolume(data);
});


function frontendChangeConnectionIdentifier(connected) {
    let frontendElementConnectedStatus = document.getElementById("statusConnection");
    let frontendElementConnectedSpinner = document.getElementById("spinnerConnection");
    let frontendElementBanner = document.getElementById("banner");
    //connected boolean
    if (connected) {
        // frontendElementBanner.classList.remove("showBanner");
        frontendElementConnectedStatus.innerText = "Connected";
        frontendElementConnectedStatus.classList.remove("text-warning");
        frontendElementConnectedStatus.classList.add("text-success");
        frontendElementConnectedSpinner.style.visibility = "hidden";
        frontendElementBanner.classList.add("hideBanner");

    } else {
        frontendElementBanner.classList.remove("hideBanner");
        frontendElementConnectedSpinner.style.visibility = "visible";
        frontendElementConnectedStatus.innerText = "Reconnecting...";
        frontendElementConnectedStatus.classList.remove("text-success");
        frontendElementConnectedStatus.classList.add("text-warning");

    }
    return;
}