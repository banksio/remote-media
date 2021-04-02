// Handles clicks of buttons

const btnPause = document.getElementById('pause');
const btnPlay = document.getElementById('play');
const prev = document.getElementById('prev');
const skip = document.getElementById('skip');
const emptyPlaylist = document.getElementById('emptyPlaylist');

const pushVideo = document.getElementById("btnPushVideo");
const appendVideo = document.getElementById("btnAppendVideo");

const reloadClients = document.getElementById("btnClientsReload");
const disconnectClients = document.getElementById("btnClientsDisconnect");

const checkQueueShuffle = document.getElementById('shuffleCheck');

export function onPauseClick(callback) {
    btnPause.addEventListener("click", callback);
}

export function onPlayClick(callback) {
    btnPlay.addEventListener("click", callback);
}

export function onPreviousClick(callback) {
    prev.addEventListener("click", callback);
}

export function onNextClick(callback) {
    skip.addEventListener("click", callback);
}

export function onEmptyPlaylistClick(callback) {
    emptyPlaylist.addEventListener("click", callback);
}

export function onPushVideoClick(callback) {
    pushVideo.addEventListener("click", () => {
        const videoID = document.getElementById("target").value;
        callback(videoID);
    });
}

export function onAppendVideoClick(callback) {
    appendVideo.addEventListener("click", () => {
        const videoID = document.getElementById('targetAppend').value;
        callback(videoID);
    });
}

export function onReloadClientsClick(callback) {
    reloadClients.addEventListener("click", callback);
}

export function onDisconnectClientsClick(callback) {
    disconnectClients.addEventListener("click", callback);
}

export function onPlaylistShuffle(callback) {
    checkQueueShuffle.addEventListener("change", (e) => {
        callback(e.target.checked);
    })
}