// Handles clicks of buttons

const btnResync = document.getElementById("seekControlPanel-btnResync");
const btnPushTS = document.getElementById("seekControlPanel-btnPushTS");

export function onResyncClick(callback) {
    btnResync.addEventListener("click", callback);
}

export function onPushTSClick(callback) {
    btnPushTS.addEventListener("click", callback);
}