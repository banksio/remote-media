// Contains all the code for various UI features of the receiver

const reconnectingSpinner = document.getElementById("bannerReconnectingSpinner");  // The reconnecting text and spinner
const connectionBanner = document.getElementById("connectionBanner");  // The banner
const connectionStatusText = document.getElementById("statusConnection");  // The connection text when the reconnecting spinner is NOT displayed
const notificationBanner = document.getElementById("notificationBanner");  // The banner
const notificationText = document.getElementById("notificationText");  // The notification text
const notificationSpinner = document.getElementById("notificationSpinner");  // The spinner
const seekControlPanel = document.getElementById("seekControlPanel");  // The banner
const nickModalSpinner = document.getElementById("nickModalSubmitSpinner");
const nickModalButton = document.querySelector("#nicknameForm > div > div.modal-footer > button");

export function frontendChangeConnectionIdentifier(connected) {
    switch (connected) {
        case 0:  // Reconnecting
            // Remove the previous status text
            frontendChangeConnectionStatusText(false);
            // Show the spinner
            reconnectingSpinner.classList.remove("d-none");
            reconnectingSpinner.classList.add("d-flex");
            // Show the banner
            connectionBanner.classList.remove("hideBanner");
            break;
        case 1:  // Connected
            // Remove the spinner
            reconnectingSpinner.classList.remove("d-flex");
            reconnectingSpinner.classList.add("d-none");
            // Show the connected text
            frontendChangeConnectionStatusText(true, true);
            // Show the banner
            connectionBanner.classList.remove("hideBanner");
            // Hide the banner (after 3s)
            connectionBanner.classList.add("hideBanner");
            break;
        case 2:  // Disconnected
            // Remove the spinner
            reconnectingSpinner.classList.remove("d-flex");
            reconnectingSpinner.classList.add("d-none");
            // Show the disconnected text
            frontendChangeConnectionStatusText(true, false);
            // Show the banner
            connectionBanner.classList.remove("hideBanner");

            break;
        default:
            break;
    }
    return;
}

export function frontendChangeConnectionStatusText(show, connected = true) {
    if (show) {
        connectionStatusText.classList.remove("d-none");
    } else {
        connectionStatusText.classList.add("d-none");
        return;
    }
    if (connected) {
        connectionStatusText.innerText = "Connected";
        connectionStatusText.classList.remove("text-danger");
        connectionStatusText.classList.add("text-success");
    } else {
        connectionStatusText.innerText = "Disconnected";
        connectionStatusText.classList.add("text-danger");
        connectionStatusText.classList.remove("text-success");
    }
    return;
}

export function showNotificationBanner(notification, persist, spinner=false) {
    console.log("Banner shown");
    switch (spinner) {
        case true:  // Don't hide after showing
            // Show the spinner
            notificationSpinner.classList.remove("d-none");
            break;
        case false:  // Hide after showing
            notificationSpinner.classList.add("d-none");
            break;
        default:
            break;
    }

    switch (persist) {
        case true:  // Don't hide after showing
            // Remove the previous status text
            frontendChangeConnectionStatusText(false);
            // Show the spinner
            notificationBanner.classList.remove("d-none");
            notificationBanner.classList.add("d-flex");
            // Set the notification text
            notificationText.innerText = notification;
            // Show the banner
            notificationBanner.classList.remove("hideBanner");
            break;
        case false:  // Hide after showing
            // Set the notification text
            notificationText.innerText = notification;
            // Show the banner
            notificationBanner.classList.remove("hideBanner");
            // Hide the banner
            setTimeout(() => {
                notificationBanner.classList.add("hideBanner");
            }, 750);
            break;
        default:
            break;
    }
    return;
}

export function frontendShowSideControlPanel(show) {
    if (show){
        // Show the sidebar
        seekControlPanel.classList.remove("hidecontrol-right");
    } else {
        // Show the sidebar
        seekControlPanel.classList.add("hidecontrol-right");
    }
    return;
}

// Show the nickname modal for the first time
export function initNicknameModal(callback) {
    'use strict';
    // Start modal
    $("#nameModal").modal({ backdrop: 'static', keyboard: false });
    
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    /*var validation = */Array.prototype.filter.call(forms, function (form) {
        form.addEventListener('input', function (/*event*/) {
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
                nickModalSpinner.style.display = "block";
                nickModalButton.setAttribute('disabled', 'disabled');
                callback(name);
            }
        }, false);
    });
}

// Prepare and show the nickname modal
export function showNicknameModal() {
    // Show the modal, hide the spinner and enable the button
    nickModalSpinner.style.display = "none";
    $('#nameModal').modal('show');
    nickModalButton.removeAttribute('disabled');
}

// Hide the nickname modal
export function hideNicknameModal() {
    $('#nameModal').modal('hide');
}