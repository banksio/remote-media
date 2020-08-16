var url = window.location.href;
var arr = url.split("/");
var result = arr[0] + "//" + arr[2];
var socket = io(result + "/");

socket.on('connect', () => {
    console.log("Connected to server with socket ID " + socket.id);
    frontendChangeConnectionIdentifier(1);
});

socket.on('disconnect', () => {
    console.log("Disconnected from server.");
    frontendChangeConnectionIdentifier(0);
});

// let name = prompt("Enter a name: ");
// socket.binary(false).emit("receiverConnected", name);

console.log("Waiting for server...");

function muteVid() {
    console.log("Not an admin panel.");
}

socket.on("serverConnectionManagement", function (data) {
    console.log("Site" + data);
    switch (data) {
        case "reload":
            location.reload();
            break;
        case "discon":
            socket.disconnect();
            frontendChangeConnectionIdentifier(2);
            break;
        default:
            console.log("Unknown site command.");
    }
});

socket.on("serverTTSSpeak", function (data) {
    var msg = new SpeechSynthesisUtterance(data);
    window.speechSynthesis.speak(msg);
});

socket.on('volumeRecv', function (data) {
    player.setVolume(data);
});

socket.on("serverBufferingClients", function (buffering) {
    if (buffering.length == 0) {
        return frontendShowNotificationBanner("Playing now", false);
    }
    let names = "Waiting for ";
    buffering.forEach(client => {
        names += (client._name + ", ");
    });
        frontendShowNotificationBanner(names, true);

});

// socket.on('pingTime', () => {
//     console.log("Pinged");
//     socket.emit('pongTime');
// });

// // the client code
// socket.on('ferret', (name, fn) => {
//     fn('woot');
// });

function frontendChangeBanner(notificationObject) {

}

function pushTimestampToServer(timestamp) {
    socket.emit("receiverTimestampSyncRequest", timestamp);
}

setInterval(() => {
    
}, 1000);

function frontendChangeConnectionIdentifier(connected) {
    let frontendElementConnectedSpinner = document.getElementById("bannerReconnectingSpinner");  // The reconnecting text and spinner
    let frontendElementBanner = document.getElementById("connectionBanner");  // The banner

    switch (connected) {
        case 0:  // Reconnecting
            // Remove the previous status text
            frontendChangeConnectionStatusText(false);
            // Show the spinner
            frontendElementConnectedSpinner.classList.remove("d-none");
            frontendElementConnectedSpinner.classList.add("d-flex");
            // Show the banner
            frontendElementBanner.classList.remove("hideBanner");
            break;
        case 1:  // Connected
            // Remove the spinner
            frontendElementConnectedSpinner.classList.remove("d-flex");
            frontendElementConnectedSpinner.classList.add("d-none");
            // Show the connected text
            frontendChangeConnectionStatusText(true, true);
            // Show the banner
            frontendElementBanner.classList.remove("hideBanner");
            // Hide the banner (after 3s)
            frontendElementBanner.classList.add("hideBanner");
            break;
        case 2:  // Disconnected
            // Remove the spinner
            frontendElementConnectedSpinner.classList.remove("d-flex");
            frontendElementConnectedSpinner.classList.add("d-none");
            // Show the disconnected text
            frontendChangeConnectionStatusText(true, false);
            // Show the banner
            frontendElementBanner.classList.remove("hideBanner");

            break;
        default:
            break;
    }
    return;
}

function frontendChangeConnectionStatusText(show, connected = true) {
    let elementConnectionStatusText = document.getElementById("statusConnection");  // The connection text when the reconnecting spinner is NOT displayed
    if (show) {
        elementConnectionStatusText.classList.remove("d-none");
    } else {
        elementConnectionStatusText.classList.add("d-none");
        return;
    }
    if (connected) {
        elementConnectionStatusText.innerText = "Connected";
        elementConnectionStatusText.classList.remove("text-danger");
        elementConnectionStatusText.classList.add("text-success");
    } else {
        elementConnectionStatusText.innerText = "Disconnected";
        elementConnectionStatusText.classList.add("text-danger");
        elementConnectionStatusText.classList.remove("text-success");
    }
    return;
}

function frontendShowNotificationBanner(notification, persist) {
    console.log("Banner shown");
    let frontendNotificationBanner = document.getElementById("notificationBanner");  // The banner
    let frontendNotificationText = document.getElementById("notificationText");  // The reconnecting text and spinner

    switch (persist) {
        case true:  // Don't hide after showing
            // Remove the previous status text
            frontendChangeConnectionStatusText(false);
            // Show the spinner
            frontendNotificationBanner.classList.remove("d-none");
            frontendNotificationBanner.classList.add("d-flex");
            // Set the notification text
            frontendNotificationText.innerText = notification;
            // Show the banner
            frontendNotificationBanner.classList.remove("hideBanner");
            break;
        case false:  // Hide after showing
            // Set the notification text
            frontendNotificationText.innerText = notification;
            // Show the banner
            frontendNotificationBanner.classList.remove("hideBanner");
            // Hide the banner
            setTimeout(() => {
                frontendNotificationBanner.classList.add("hideBanner");
            }, 750);
            break;
        default:
            break;
    }
    return;
}

function frontendShowSideControlPanel(show) {
    let frontendSeekControlPanel = document.getElementById("seekControlPanel");  // The banner

    if (show){
        // Show the sidebar
        frontendSeekControlPanel.classList.remove("hidecontrol-right");
    } else {
        // Show the sidebar
        frontendSeekControlPanel.classList.add("hidecontrol-right");
    }
    return;
}

// Validation Check for Nickname
(function () {
    'use strict';
    window.addEventListener('load', function () {
        // Start modal
        $("#nameModal").modal({ backdrop: 'static', keyboard: false });
        
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation');
        // Loop over them and prevent submission
        var validation = Array.prototype.filter.call(forms, function (form) {
            form.addEventListener('input', function (event) {
                let valid = form.checkValidity();
                form.classList.add('was-validated');
                if (valid === false) return;
            }, false);
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                event.stopPropagation();

                // Check validity and don't continue if invalid
                let valid = form.checkValidity();
                form.classList.add('was-validated');
                if (valid === false) return;

                // Validate and send nickname
                let name = document.getElementById('validationDefault01').value;
                if (name !== "") {
                    // Check nickname async
                    // TODO: Show loading spinner or something
                    checkNickname(name);
                }
            }, false);
        });
    }, false);
})();

// Ask the server to validate the nickname and get the response
function checkNickname(nick) {
    socket.emit('receiverNickname', nick, (error) => { // Async callback with server's validation response
        // If response is true, we're good - hide the modal
        if (error == undefined){
            $('#nameModal').modal('hide');
            return;
        }
        // If response is false, there's been an error
        alert("Setting nickname has been encountered an error: " + error);
        return error;
    });
}