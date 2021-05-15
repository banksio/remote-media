const url = window.location.href;
const arr = url.split("/");
const result = arr[0] + "//" + arr[2];
const socket = io(result + "/");

const nickModalSpinner = document.getElementById("nickModalSubmitSpinner");
const nickModalButton = document.querySelector("#nicknameForm > div > div.modal-footer > button");

const receiverDetails = {
    nickname: undefined,
};

socket.on("connect", () => {
    console.log("Connected to server with socket ID " + socket.id);
    frontendChangeConnectionIdentifier(1);
    if (receiverDetails.nickname) {
        checkNickname(receiverDetails.nickname);
    }
});

socket.on("disconnect", () => {
    console.log("Disconnected from server.");
    frontendChangeConnectionIdentifier(0);
});

// let name = prompt("Enter a name: ");
// socket.emit("receiverConnected", name);

console.log("Waiting for server...");

function muteVid() {
    console.log("Not an admin panel.");
}

socket.on("serverConnectionManagement", data => {
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

socket.on("serverTTSSpeak", data => {
    const msg = new SpeechSynthesisUtterance(data);
    window.speechSynthesis.speak(msg);
});

socket.on("volumeRecv", data => {
    player.setVolume(data);
});

socket.on("serverBufferingClients", buffering => {
    if (buffering.length == 0) {
        return frontendShowNotificationBanner("Playing now", false);
    }
    let names = "Waiting for ";
    buffering.forEach(client => {
        names += client._name + ", ";
    });
    frontendShowNotificationBanner(names, true, true);
});

// socket.on('pingTime', () => {
//     console.log("Pinged");
//     socket.emit('pongTime');
// });

// // the client code
// socket.on('ferret', (name, fn) => {
//     fn('woot');
// });

function frontendChangeBanner(notificationObject) {}

function pushTimestampToServer(timestamp) {
    frontendShowNotificationBanner("Syncing others...", true, true);
    const data = {
        timestamp: timestamp,
        videoID: vid,
    };
    socket.emit("receiverTimestampSyncRequest", data, error => {
        if (error) {
            frontendShowNotificationBanner("Error syncing others: " + error, false, false);
        }
    });
}

setInterval(() => {}, 1000);

function frontendChangeConnectionIdentifier(connected) {
    const frontendElementConnectedSpinner = document.getElementById("bannerReconnectingSpinner"); // The reconnecting text and spinner
    const frontendElementBanner = document.getElementById("connectionBanner"); // The banner

    switch (connected) {
        case 0: // Reconnecting
            // Remove the previous status text
            frontendChangeConnectionStatusText(false);
            // Show the spinner
            frontendElementConnectedSpinner.classList.remove("d-none");
            frontendElementConnectedSpinner.classList.add("d-flex");
            // Show the banner
            frontendElementBanner.classList.remove("hideBanner");
            break;
        case 1: // Connected
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
        case 2: // Disconnected
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
    const elementConnectionStatusText = document.getElementById("statusConnection"); // The connection text when the reconnecting spinner is NOT displayed
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

function frontendShowNotificationBanner(notification, persist, spinner = false) {
    console.log("Banner shown");
    const frontendNotificationBanner = document.getElementById("notificationBanner"); // The banner
    const frontendNotificationText = document.getElementById("notificationText"); // The notification text
    const frontendNotificationSpinner = document.getElementById("notificationSpinner"); // The spinner

    switch (spinner) {
        case true: // Don't hide after showing
            // Show the spinner
            frontendNotificationSpinner.classList.remove("d-none");
            break;
        case false: // Hide after showing
            frontendNotificationSpinner.classList.add("d-none");
            break;
        default:
            break;
    }

    switch (persist) {
        case true: // Don't hide after showing
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
        case false: // Hide after showing
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
    const frontendSeekControlPanel = document.getElementById("seekControlPanel"); // The banner

    if (show) {
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
    "use strict";
    window.addEventListener(
        "load",
        () => {
            // Start modal
            $("#nameModal").modal({ backdrop: "static", keyboard: false });

            // Fetch all the forms we want to apply custom Bootstrap validation styles to
            const forms = document.getElementsByClassName("needs-validation");
            // Loop over them and prevent submission
            const validation = Array.prototype.filter.call(forms, form => {
                form.addEventListener(
                    "input",
                    event => {
                        const valid = form.checkValidity();
                        form.classList.add("was-validated");
                        if (valid === false) return;
                    },
                    false
                );
                form.addEventListener(
                    "submit",
                    event => {
                        event.preventDefault();
                        event.stopPropagation();

                        // Check validity and don't continue if invalid
                        const valid = form.checkValidity();
                        form.classList.add("was-validated");
                        if (valid === false) return;

                        // Validate and send nickname
                        const name = document.getElementById("validationDefault01").value;
                        if (name !== "") {
                            // Check nickname async
                            nickModalSpinner.style.display = "block";
                            nickModalButton.setAttribute("disabled", "disabled");
                            checkNickname(name);
                        }
                    },
                    false
                );
            });
        },
        false
    );
})();

// Ask the server to validate the nickname and get the response
function checkNickname(nick) {
    socket.emit("receiverNickname", nick, error => {
        // Async callback with server's validation response
        nickModalSpinner.style.display = "none";
        // If response is undefined, we're good - hide the modal
        if (error === null) {
            receiverDetails.nickname = nick;
            $("#nameModal").modal("hide");
            frontendShowNotificationBanner("Set nickname: " + receiverDetails.nickname, false, false);
            return;
        }
        $("#nameModal").modal("show");
        nickModalButton.removeAttribute("disabled");
        // If response is anything else, there's been an error
        alert("Setting nickname has been encountered an error: " + error);
        return error;
    });
}
