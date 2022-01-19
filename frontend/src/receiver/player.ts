import { consoleLogWithTime } from "./debug";

let player: YT.Player, state;
let vid = "pE49WK-oNjU";

const firstVideo = true;
// Preloading new videos
// let preloading = false;
// let finishingPreload = false;

// let seekingToNewTS = false; // For when we're skipping to a new TS
// let seekingTS = 0;

class EventOrchestrator {
    private _playerPreloadOngoing = false;
    private _playerPreloadFinishing = false;

    public seekingToNewTS = false; // For when we're skipping to a new TS
    public seekingTS = 0;

    private _playerPreloadPromise: Promise<string> = Promise.resolve(vid);
    private _playerPreloadOngoingStateChecker: ((playerState: YT.PlayerState) => boolean) | undefined;
    private _player!: YT.Player;

    constructor() {
        this._playerPreloadOngoing = false;
        this._playerPreloadFinishing = false;

        this.seekingToNewTS = false; // For when we're skipping to a new TS
        this.seekingTS = 0;
    }

    set player(player: YT.Player) {
        this._player = player;
    }

    get playerPreloadPromise() {
        return this._playerPreloadPromise;
    }

    private setPreloadingFalse() {
        this._playerPreloadOngoing = false;
        this._playerPreloadFinishing = false;
    }

    private setPlayerPreloadOngoing(preloading: boolean) {
        this._playerPreloadOngoing = preloading;
        this._playerPreloadFinishing = !preloading;
    }

    private setPlayerPreloadFinishing(preloading: boolean) {
        this._playerPreloadOngoing = !preloading;
        this._playerPreloadFinishing = preloading;
    }

    setPlayerPreloading(videoID: string): Promise<string> {
        this._playerPreloadPromise = new Promise<string>((resolve, reject) => {
            // Clear old stuff
            this.seekingToNewTS = false; // For when we're skipping to a new TS
            this.seekingTS = 0;

            // Set preloading true, send to server
            this.setPlayerPreloadOngoing(true);
            // TODO: Check this and add back if necessary later
            // eventNewStatus(player.getPlayerState(), true, vid, vid);

            // Mute and load video
            this._player.mute();
            try {
                this._player.loadVideoById(videoID);
            } catch (error) {
                reject(error);
            }

            vid = videoID;

            this._playerPreloadOngoingStateChecker = (playerState: YT.PlayerState): boolean => {
                // We're preloading, but the video has started playing. Must be done!
                switch (playerState) {
                    case YT.PlayerState.PLAYING: // And the video is now playing
                        // TODO: Re-add these
                        // eventNewStatus(playerState, this._playerPreloadOngoing, firstVideo, vid); // For sending to server
                        // callbacks.onNewStatus(playerState, this._playerPreloadOngoing); // Not for sending to server
                        // eventVideoDetails(); // Send the server the video details
                        this.preloadFinisher(); // Finish preloading
                        resolve(videoID);
                        // Remove the hook
                        this._playerPreloadOngoingStateChecker = undefined;
                        return true; // Don't continue or fire any more callbacks
                    default:
                        break;
                }
                return false;
            };
        }).then();
        return this.playerPreloadPromise;
    }

    // canPlayerPreloadFinish(playerState: YT.PlayerState): boolean {
    //     // If we're preloading

    // }

    onPlayerStateChange(event: YT.OnStateChangeEvent) {
        if (this._playerPreloadFinishing) return; // Don't do anything whilst we're finishing the preload

        const newState = event.data;

        // If we're preloading and we're ready to finish preloading, don't continue or fire any more callbacks
        if (this._playerPreloadOngoing && this._playerPreloadOngoingStateChecker !== undefined) {
            if (this._playerPreloadOngoingStateChecker(newState)) return;
        }

        // TODO: Evaluate and re-add
        // if (this.seekingToNewTS) {
        //     // If we're seeking to a new TS
        //     switch (newState) {
        //         case 1: // And the video is now playing
        //             seekFinisher(this.seekingTS); // Finish seeking
        //             return;
        //         default:
        //             return;
        //     }
        // }

        // Update statuses
        eventNewStatus(newState, this._playerPreloadOngoing, firstVideo, vid); // For sending to server
        callbacks.onNewStatus(newState, this._playerPreloadOngoing); // Not for sending to server
    }

    private preloadFinisher() {
        this.setPlayerPreloadFinishing(true);
        consoleLogWithTime("[Player] Nearly preloaded.");
        this._player.pauseVideo(); // Pause the video
        this._player.seekTo(0, true); // Go back to the start
        this._player.unMute(); // Unmute the video ready for playing
        this.setPreloadingFalse();
        consoleLogWithTime("[Player] Preloading done.");
        eventNewStatus(2, this._playerPreloadOngoing, firstVideo, vid);
        callbacks.event("receiverPlayerPreloadingFinished", vid);
        // callbacks.playerPreloadingFinished(vid);
    }

    playerPreloadFinished() {
        Promise.resolve(this._playerPreloadPromise)
    }

    playerPreloadFailed() {
        Promise.resolve(this._playerPreloadPromise)
    }
}

const eventOrchestrator: EventOrchestrator = new EventOrchestrator();

const callbacks: {
    playerPreloadingFinished: () => void,
    onNewStatus: (status: number, preloading: boolean) => void,
    onTimestampRequest: (timestamp: number) => void,
    event: (event: string, data?: any) => void,
} = {
    playerPreloadingFinished: () => { },
    onNewStatus: (status: number, preloading: boolean) => { },
    onTimestampRequest: (timestamp: number) => { },
    event: (event: string, data?: any) => { },
};

export function loadYouTubeIframeAPI() {
    // Create a script tag with the source as the YouTube IFrame API, and insert it into the document
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
}

// This function creates an <iframe> (and YouTube player) after the API code downloads.
export function onYouTubeIframeAPIReady() {
    // eslint-disable-next-line no-undef
    player = new YT.Player(document.getElementById("player")!, {
        // playerVars: {'autoplay': 1, 'controls': 1, 'rel' : 0, 'fs' : 0},
        playerVars: { autoplay: 1, controls: 1, disablekb: 0, fs: 0 },
        events: {
            onReady: onPlayerReady,
        },
    });
    player.addEventListener("onStateChange", eventOrchestrator.onPlayerStateChange.bind(eventOrchestrator));
    eventOrchestrator.player = player;

    // TODO: Check seeking code and re-add as necessary
    // let lastTime = -1;
    // const interval = 1000;

    // const checkPlayerTime = function () {
    //     if (lastTime !== -1) {
    //         // eslint-disable-next-line no-undef
    //         if (player.getPlayerState() === YT.PlayerState.PLAYING) {
    //             const t = player.getCurrentTime();

    //             // consoleLogWithTime(Math.abs(t - lastTime -1));

    //             // /expecting 1 second interval , with 500 ms margin
    //             if (Math.abs(t - lastTime - 1) > 0.5) {
    //                 // there was a seek occuring
    //                 consoleLogWithTime("seek"); // / fire your event here !
    //             }
    //         }
    //     }
    //     lastTime = player.getCurrentTime();
    //     setTimeout(checkPlayerTime, interval); // / repeat function call in 1 second
    // };
    // setTimeout(checkPlayerTime, interval); // / initial call delayed
}

// The API will call this function when the video player is ready.
export function onPlayerReady(event: YT.PlayerEvent) {
    player = event.target;
    consoleLogWithTime("[Player] Ready.");
    // Let the server know we're ready for some videos!
    callbacks.event("receiverPlayerReady");
}

// Control the player when instructed by the server
export function serverPlayerControl(data: string) {
    state = player.getPlayerState();
    switch (data) {
        case "pause":
            if (state !== 3 && state !== -1) {
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

export function seekToTimestamp(timestamp: number, play = true) {
    // TODO: Evaluate and re-add
    // eventNewStatus(3, preloading, firstVideo, vid); // Tell the server!
    // seekingToNewTS = true;
    // timestamp = timestamp / 1000; // Must convert to seconds as this is what the YouTube API expects
    // seekingTS = timestamp; // Set to global
    // player.playVideo(); // Play the video so we can ensure we're not buffering
    // player.seekTo(seekingTS, true);
}

function seekFinisher(timestamp: number) {
    // TODO: Evaluate and re-add
    // player.pauseVideo(); // Buffered, so pause
    // player.seekTo(timestamp, true); // Seek back to where we were meant to be
    // seekingToNewTS = false; // Ready to go
    // eventNewStatus(2, preloading, firstVideo, vid); // Tell the server
}

export function getVideoIDObj() {
    return {
        videoID: vid,
    };
}

export function onTimestampRequest(callback: (timestamp: number) => void) {
    callbacks.onTimestampRequest = callback;
}

// Preloading new video once already played one video; mute the player and play the video
export function preloadVideoSync(id: string) {
    // TODO: Evaluate and re-add
    // consoleLogWithTime("Preloading..." + id);
    // // Clear old stuff
    // seekingToNewTS = false; // For when we're skipping to a new TS
    // seekingTS = 0;
    // // Set preloading true, send to
    // preloading = true;
    // vid = id;
    // eventNewStatus(player.getPlayerState(), true, vid, vid);
    // player.mute();
    // player.loadVideoById(vid);
}

// Preloading new video once already played one video; mute the player and play the video
export function preloadVideo(videoID: string): Promise<string> {
    consoleLogWithTime("[Player] Preloading ID: " + videoID);
    return eventOrchestrator.setPlayerPreloading(videoID);
}

// When the player's state changes
export function onPlayerStateChange(event: YT.OnStateChangeEvent) {

}

// Main.js
function eventNewStatus(state: number, preloading: boolean, firstVideo: boolean | string, currentVideoID: string) {
    // TODO: Evaluate and re-add
    // callbacks.event("receiverPlayerStatus", {
    //     videoID: currentVideoID,
    //     data: {
    //         state: state,
    //         preloading: preloading,
    //         firstVideo: firstVideo,
    //     },
    // });
}

export function onNewStatus(callback: (status: number, preloading: boolean) => void) {
    callbacks.onNewStatus = callback;
}

function preloadFinisher() {

}

export function onPlayerPreloadingFinished(callback: () => void) {
    callbacks.playerPreloadingFinished = callback;
}

export function getCurrentTimestamp() {
    return player.getCurrentTime() * 1000; // Must multiply by 1000 as the server expects milliseconds
}

export function getCurrentVideoID() {
    return vid;
}

export function getCurrentVideoData() {
    return player.getVideoData();
}

// main.js
function eventVideoDetails() {
    // TODO: Evaluate and re-add
    // const videoDetails = player.getVideoData();
    // const videoDuration = player.getDuration();
    // consoleLogWithTime(videoDetails);
    // callbacks.event("receiverVideoDetails", {
    //     id: videoDetails.video_id,
    //     title: videoDetails.title,
    //     channel: videoDetails.author,
    //     duration: videoDuration * 1000,
    // });
}

export function onEvent(callback: (event: string, data?: any) => void) {
    callbacks.event = callback;
}

// startScreensaver();
