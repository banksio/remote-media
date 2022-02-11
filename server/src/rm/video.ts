import chalk from "chalk";
import { ValueError } from "./error";
import { debug, info } from "./logging";
import { getIDFromURL } from "./utils";

export interface VideoDetails {
    id: string;
    title: string;
    channel: string;
    duration: number;
}

export class Video {
    readonly id: string;
    readonly title: string;
    readonly channel: string;
    readonly duration: number;

    constructor(id: string, title: string, channel: string, duration: number) {
        this.id = id;
        this.title = title ? title : id;
        this.channel = channel;
        this.duration = duration;
    }

    // setIDFromURL(url: string) {
    //     this.id = getIDFromURL(url);
    //     this.title = this.title ? this.title : this.id;
    // }
}


export class OldVideo {
    id: string;
    title: string;
    channel: string;
    duration: number;

    constructor(id: string, title?: string, channel = "Unknown", duration = 0) {
        this.id = id;
        this.title = title ? title : id;
        this.channel = channel;
        this.duration = duration;
    }

    setIDFromURL(url: string) {
        this.id = getIDFromURL(url);
        this.title = this.title ? this.title : this.id;
    }
}



export class ServerVideo extends OldVideo {
    private _state: number;
    startingTime: number;
    private _elapsedTime: number;
    private _pausedSince: number;
    private _pausedTime: number;
    cbStateDelay: CallableFunction | undefined;
    private _stateDelayInterval: NodeJS.Timeout | undefined;
    private _cbStateChange: any;
    private _cbWhenFinished: any;
    oof2: number | undefined;
    private _timeRemainingSinceLastResumed: number | undefined;
    private _cbWhenFinishedTimeout: NodeJS.Timeout | undefined;
    oof1: string | undefined;

    constructor(id: string, title?: string, channel = "Unknown", duration = undefined) {
        super(id, title, channel, duration);

        this._state = 5; // The state of the video (matches the official YouTube API's states)
        this.startingTime = -1; // The timestamp at which the video started
        this._elapsedTime = 0; // The duration the video's been playing
        this._pausedSince = 0; // The timestamp of when it was paused
        this._pausedTime = 0; // The duration it's been paused
    }

    cyclicReplacer(key: any, value: any) {
        if (key == "cbStateDelay") return undefined;
        else if (key == "_stateDelayInterval") return undefined;
        else if (key == "_cbWhenFinished") return undefined;
        else if (key == "_cbWhenFinishedTimeout") return undefined;
        else if (key == "cbStateDelayRoomRef") return undefined;
        else return value;
    }

    public set timestamp(ts: number) {
        debug("[ServerVideo] Timestamp set to " + chalk.redBright(ts));
        if (ts < 0) {
            throw new ValueError("Video timestamp cannot be a negative value");
        }

        debug(chalk.yellowBright("Received new timestamp of ") + ts);
        const timeNow = new Date().getTime();
        this.startingTime = timeNow - ts; // Set time started in the past by number of ms the timestamp is
        this._pausedTime = 0; // This resets the video pause timer
        if (this.state == 1) {
            // If the video is playing
            this._pausedSince = 0; // This effectively sets the video as playing
        } else if (this.state >= 2) {
            // If the video is paused
            this._pausedSince = timeNow;
        }
    }

    // get duration() {
    //     return this.duration;
    // }
    // set duration(time) {
    //     this.duration = time;
    //     return;
    // }

    get pausedTime() {
        if (this._pausedSince != 0) {
            return this._pausedTime + (new Date().getTime() - this._pausedSince);
        }
        return this._pausedTime;
    }

    get state() {
        return this._state;
    }

    set state(newState) {
        this._state = newState;
        // console.log(this.startingTime);
        // console.log(this._state);
        // console.log(this._pausedSince);
        // if (this.startingTime != 0) {  // If the video has elapsed time
        //     if (this.state != 1) {  // If the video is paused for buffering
        //         this.pauseTimer();
        //     } else if (this.state == 1) {  // If the video is playing
        //         if (this._pausedSince != 0) {  // And it was previously paused
        //             this.resumeTimer();
        //         }
        //     }
        // } else if (this.state == 1) {
        //     this.startingTime = new Date().getTime();

        // }

        // No timing operations here
        // If there's a delay callback set
        if (this.cbStateDelay && this.state != 0) {
            // After 2 seconds, if the video is not playing, call the delay callback
            this._stateDelayInterval = setTimeout(() => {
                if (this.state != 1) {
                    if (this.cbStateDelay) this.cbStateDelay(this.state);
                    return;
                }
            }, 2000);
            // clearInterval(1);
        }
        if (this._cbStateChange) this._cbStateChange(this.state);
    }

    setState(newState: number, action = true) {
        this._state = newState;
        // No timing operations here
        // If there's a delay callback set
        if (this.cbStateDelay && this.state != 0) {
            // After 2 seconds, if the video is not playing, call the delay callback
            this._stateDelayInterval = setTimeout(() => {
                if (this.state != 1) {
                    if (this.cbStateDelay) this.cbStateDelay(this.state);
                    return;
                }
            }, 2000);
            // clearInterval(1);
        }
        if (this._cbStateChange) {
            return this._cbStateChange(this.state, action);
        }
        return;
    }

    // Get the elapsed time of the video relative to the starting time
    getElapsedTime(currentTime = new Date().getTime()) {
        // this.elapsedTime = Math.round((currentTime - this.startingTime));
        if (this._state >= 2 && this._state <= 3 && this.startingTime != -1) {
            // If the video is paused then we need to subract the two timestamps
            // console.log("this time was generated by method 1, " + this._pausedSince)
            return this._pausedSince - this.startingTime - this._pausedTime; // Get the elapsed time
        }

        if (this._pausedSince != 0) {
        }
        if (this.startingTime == -1) {
            return 0;
        }
        // console.log(chalk.blueBright("[classes.js][ServerVideo] The video's currently elapsed time is " + this._elapsedTime + " and has been paused for " + this._pausedTime));
        // console.log("this time was generated by method 2, " + this._pausedTime)
        return currentTime - this.startingTime - this._pausedTime;
    }

    pauseTimer(time = new Date().getTime()) {
        this._pausedSince = new Date().getTime(); // Set the time of pausing
        info(chalk.yellowBright("[ServerVideo] The video has been set paused."));
        if (this._cbWhenFinishedTimeout) {
            clearTimeout(this._cbWhenFinishedTimeout);
            debug("[ServerVideo] The timeout has been cleared ");
        }
    }

    resumeTimer(time = new Date().getTime()) {
        if (this._pausedSince == 0) {
            throw new Error("The video was not paused, so the timer cannot be resumed");
        }
        this._pausedTime += time - this._pausedSince;
        this._pausedSince = 0;
        // Callback when the video has finished

        info(chalk.greenBright("[ServerVideo] The video has been resumed. It was paused for " + this._pausedTime));
    }

    whenFinished(cbWhenFinished: CallableFunction) {
        this._cbWhenFinished = cbWhenFinished;
        return;
    }

    // Function to set the video playing
    playVideo() {
        if (this._state >= 2 && this._state <= 3) {
            // If the video was previously paused
            this.resumeTimer(); // Resume the timer - This can only be run if the video was previously paused
        } else if (this._state == 5) {
            // If the video was previously cued
            this.startingTime = new Date().getTime(); // Set the starting time of the video to now
        }
        // Play the video, use setter to trigger callbacks and timeouts
        this.setState(1);

        const oof0 = this.title; // Debugging stuff

        // TODO: Ensure this is tested
        if (this._cbWhenFinishedTimeout) clearTimeout(this._cbWhenFinishedTimeout); // Clear the video finishing timeout

        // Debug stuff
        debug("[ServerVideo] " + oof0 + " Cleared any existing timestamp.");
        // this.oof1 = (this._duration - (this._elapsedTime));
        this.oof2 = new Date().getTime();
        // console.log(oof0 + " DEBUGGGGGGGGGGGG Set timeout to " + (this._duration - (this._elapsedTime)));

        debug("[ServerVideo] New duration: " + this.duration);
        debug("[ServerVideo] New elapsed time: " + this.getElapsedTime());
        this._timeRemainingSinceLastResumed = this.duration - this.getElapsedTime(); // Set the time remaining

        // If there's a video finished callback set, set a timeout for when the video finishes
        if (this._cbWhenFinished) {
            this._cbWhenFinishedTimeout = setTimeout(
                id => {
                    // , to call the callback
                    debug("[ServerVideo] " + oof0 + " THE VIDEO HAS FINISHED");
                    if (this.oof2)
                        debug(
                            "[ServerVideo] " +
                                oof0 +
                                " OFFFFFFFFFFFFFFFFFFFFFFFFFOOOFFFFFFFFFFFFFFFFFFFFF" +
                                (new Date().getTime() - this.oof2)
                        );
                    debug("[ServerVideo] " + oof0 + " " + this.oof1);
                    this.setState(0);
                    return this._cbWhenFinished(); // Call the callback
                },
                this._timeRemainingSinceLastResumed,
                oof0
            );
        }
    }

    // Function to pause the video
    pauseVideo(buffer: boolean, callback = true) {
        debug("[ServerVideo] Video has been paused");
        this.pauseTimer();
        if (buffer) {
            this.setState(3, callback);
        } else {
            this.setState(2, callback);
        }
        return;
    }

    onPlayDelay(cb: CallableFunction) {
        this.cbStateDelay = cb;
        // this.cbStateDelayRoomRef = room;
    }

    onStateChange(cbStateChange: CallableFunction) {
        this._cbStateChange = cbStateChange;
        return;
    }

    public clearFinishedTimeout(): void {
        if (this._cbWhenFinishedTimeout) clearTimeout(this._cbWhenFinishedTimeout);
    }
}
