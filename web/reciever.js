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
// socket.emit("recieverConnected", name);

function muteVid(){
    console.log("Not an admin panel.");
}
 
socket.on("serverConnectionManagement", function(data){
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
 
socket.on("serverTTSSpeak", function (data) {
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

// Validation Check for Nickname
(function() {
    'use strict';
    window.addEventListener('load', function() {
        // Start modal
        $("#nameModal").modal({backdrop: 'static', keyboard: false});
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation');
        // Loop over them and prevent submission
        var validation = Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('click', function(event) {
                if (form.checkValidity() === false) {
                event.preventDefault();
                event.stopPropagation();
                }
                form.classList.add('was-validated');
                // Check whether button was pressed, if validated hide modal and send nickname to server
                document.querySelector("#nicknameForm > div > div.modal-footer > button").addEventListener('click', function(event) {
                    let name = document.getElementById('validationDefault01').value;
                    if (name !== "") {
                        $('#nameModal').modal('hide');
                        socket.emit("receiverNickname", name);
                    }
                }, false);
            
            }, false);
        });
        }, false);
    })();