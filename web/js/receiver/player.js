var player, state;
var vid = 'pE49WK-oNjU';

var firstVideo = true;
// Preloading new videos
var preloading = false;

const callbacks = {};

export function loadYouTubeIframeAPI() {
    // Create a script tag with the source as the YouTube IFrame API, and insert it into the document
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}


// This function creates an <iframe> (and YouTube player) after the API code downloads.
export function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        // playerVars: {'autoplay': 1, 'controls': 1, 'rel' : 0, 'fs' : 0},
        playerVars: { 'autoplay': 1, 'controls': 1, 'disablekb': 0, 'fs': 0 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

    var lastTime = -1;
    var interval = 1000;

    var checkPlayerTime = function () {
        if (lastTime != -1) {
            if (player.getPlayerState() == YT.PlayerState.PLAYING) {
                var t = player.getCurrentTime();

                //console.log(Math.abs(t - lastTime -1));

                ///expecting 1 second interval , with 500 ms margin
                if (Math.abs(t - lastTime - 1) > 0.5) {
                    // there was a seek occuring
                    console.log("seek"); /// fire your event here !
                }
            }
        }
        lastTime = player.getCurrentTime();
        setTimeout(checkPlayerTime, interval); /// repeat function call in 1 second
    }
    setTimeout(checkPlayerTime, interval); /// initial call delayed 
}

//The API will call this function when the video player is ready.
export function onPlayerReady(event) {
    player = event.target;
    console.log("YouTube player ready.");

    //iframe = $('#player');
    // preloadVideo(vid);
    //$("player").keydown(false);
    // player.cueVideoById(vid);
    // muteVid();

    // Let the server know we're ready for some videos!
    callbacks.event("receiverPlayerReady");
    // socket.binary(false).emit("receiverPlayerReady");
    // alert("ready");
}

// socket.on("serverCurrentVideo", function (video) {
//     vid = video.id;
// });

// setTimeout(() => {
//     const interval = setInterval(function() {
//         socket.binary(false).emit("playerBuffered", { buffered: player.getVideoLoadedFraction(), socketID: socket.id, state: player.getPlayerState() });
//     }, 5000);
// }, 1000);

// Control the player when instructed by the server
export function serverPlayerControl(data) {
    state = player.getPlayerState();
    switch (data) {
        case "pause":
            if (state != 3 && state != -1) {
                player.pauseVideo();
            }
            break;
        case "play":
            player.playVideo();
            // frontendShowNotificationBanner("Playing", false);
            break;
        case "mute":
            player.mute();
            break;
        case "unmute":
            player.unMute();
            break;
    }
}

// When a new video comes in, preload the video
// socket.on("serverNewVideo", function (data) {
//     // if (firstVideo == false) {
//     //     firstVideo = true;
//     // }
//     preloadVideo(data.value);
// });

// Adjust the timestamp of the player to sync with the server
// socket.on("serverVideoTimestamp", function (timestamp) {
//     console.log("playingFirst" + timestamp);
//     // firstVideo = false;
//     skipToTimestamp(timestamp);
// });

export function skipToTimestamp(timestamp) {
    timestamp = timestamp / 1000  // Must convert to seconds as this is what the YouTube API expects
    player.playVideo();
    player.seekTo(timestamp);
}

export function getVideoIDObj() {
    return {
        videoID: vid
    }
}

export function onTimestampRequest(callback) {
    callbacks.onTimestampRequest = callback;
}

// Preloading new video once already played one video; mute the player and play the video
export function preloadVideo(id) {
    console.log("Preloading..." + id);
    // Set preloading true, send to 
    preloading = true;
    vid = id;
    eventNewStatus(player.getPlayerState(), true, vid, vid)
    player.mute();
    player.loadVideoById(vid);
}

// When the player's state changes
export function onPlayerStateChange(event) {
    let newState = event.data;
    if (preloading) {  // If we're preloading
        switch (newState) {
            case 1:  // And the video is now playing
                eventNewStatus(newState, preloading, firstVideo, vid);  // For sending to server
                callbacks.onNewStatus(newState, preloading);  // Not for sending to server
                eventVideoDetails();  // Send the server the video details
                preloadFinisher();  // Finish preloading
                return;  // Don't continue or fire any more callbacks
            default:
                break;
        }
    }
    eventNewStatus(newState, preloading, firstVideo, vid);  // For sending to server
    callbacks.onNewStatus(newState, preloading);  // Not for sending to server
}

// Main.js
function eventNewStatus(state, preloading, firstVideo, currentVideoID) {
    callbacks.event("receiverPlayerStatus", {
        "videoID": currentVideoID,
        data: {
            "state": state,
            "preloading": preloading,
            "firstVideo": firstVideo
        }
    });
    // socket.binary(false).emit("receiverPlayerStatus", {
    //     "videoID": currentVideoID,
    //     data: {
    //         "state": state,
    //         "preloading": preloading,
    //         "firstVideo": firstVideo
    //     }
    // });
}

export function onNewStatus(callback) {
    callbacks.onNewStatus = callback;
}

function preloadFinisher() {
    player.removeEventListener('onStateChange', onPlayerStateChange);
    console.log("Nearly preloaded.");
    player.pauseVideo();  // Pause the video
    player.seekTo(0); // Go back to the start
    player.unMute();  // Unmute the video ready for playing
    preloading = false;
    console.log("Preloading done.");
    // socket.binary(false).emit("receiverPlayerStatus", { "state": state, "preloading": false });
    // socket.binary(false).emit("receiverPlayerPreloadingFinished", vid);  Freshly deleted
    eventNewStatus(2, preloading, firstVideo, vid);
    callbacks.event("receiverPlayerPreloadingFinished", vid);
    // callbacks.playerPreloadingFinished(vid);
    player.addEventListener('onStateChange', onPlayerStateChange);
}

export function onPlayerPreloadingFinished(callback){
    callbacks.playerPreloadingFinished = callback;
}

export function getCurrentTimestamp() {
    return player.getCurrentTime() * 1000;  // Must multiply by 1000 as the server expects milliseconds
}

export function getCurrentVideoID() {
    return vid;
}

export function getCurrentVideoData() {
    return player.getVideoData();
}

// main.js
function eventVideoDetails() {
    let videoDetails = player.getVideoData();
    let videoDuration = player.getDuration();
    console.log(videoDetails);
    callbacks.event("receiverVideoDetails", {
        id: videoDetails.video_id,
        title: videoDetails.title,
        channel: videoDetails.author,
        duration: videoDuration * 1000
    })
    // socket.binary(false).emit("receiverVideoDetails", {
    //     id: videoDetails.video_id,
    //     title: videoDetails.title,
    //     channel: videoDetails.author,
    //     duration: videoDuration
    // });
}

export function onEvent(callback) {
    callbacks.event = callback
}

// startScreensaver();