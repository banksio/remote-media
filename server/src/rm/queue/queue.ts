import { debug } from "../logging";
import { getIDFromURL } from "../utils";
import { OldVideo } from "../video";
import { shuffle } from "./shuffle";

export class NewQueue {
    private _videos: OldVideo[];
    private _videosShuffled: OldVideo[];
    private _currentIndex: number;
    private _currentVideo: OldVideo | undefined;
    private _nextIndex: number;
    private _lengthUnplayed: number;
    private _lengthPlayed: number;
    unplayedVideos: boolean;
    private _shuffle: boolean;

    constructor(shuffle = false) {
        this._videos = [];
        this._videosShuffled = [];
        this._currentIndex = -1;
        this._currentVideo = undefined;
        this._nextIndex = 0;
        this._lengthUnplayed = 0;
        this._lengthPlayed = 0;
        this.unplayedVideos = false;
        this._shuffle = shuffle;
    }

    cyclicReplacer(key: any, value: any) {
        if (key === "_currentVideo") return undefined;
        else return value;
    }

    // set currentIndex(index){
    //     this._currentIndex = index;
    //     this.nextIndex = index + 1;
    // }

    get currentIndex() {
        return this._currentIndex;
    }

    // set nextIndex(index){
    //     this._nextIndex = index;
    // }

    // get nextIndex(){
    //     return this._nextIndex;
    // }

    get length() {
        return this._lengthUnplayed;
    }

    set shuffle(newShuffle) {
        const oldShuffle = this._shuffle;
        debug("[Queue] Shuffle was " + oldShuffle);
        this._shuffle = newShuffle;
        debug("[Queue] Shuffle is now " + this._shuffle);
        if (oldShuffle === true && this._shuffle === false) {
            // If shuffle has been switched off
            // We need to find the current video in the regular array and set the current index to that
            // Find the index of the current video in the regular array
            this._currentIndex = this._videos.indexOf(this._videosShuffled[this._currentIndex]);
            // Set the number of unplayed videos in the regular playlist based on the new current index
            this._lengthUnplayed = this._videos.length - this._currentIndex - 1;
            this._lengthPlayed = this._videos.length - this._lengthUnplayed;
            // Set the next nextIndex if there are videos left after the current one
            if (this._lengthUnplayed !== 0) this._nextIndex = this._currentIndex + 1;
        } else if (oldShuffle === false && this._shuffle === true) {
            // If shuffle has been switched on
            this._generateShuffled();
            // We need to find the current video in the shuffled array and set the current index to that
            // Find the index of the current video in the regular array
            this._currentIndex = this._videosShuffled.indexOf(this._videos[this._currentIndex]);
            // Set the number of unplayed videos in the regular playlist based on the new current index
            this._lengthUnplayed = this._videosShuffled.length - this._currentIndex - 1;
            this._lengthPlayed = 1;
            // Set the next nextIndex if there are videos left after the current one
            if (this._lengthUnplayed !== 0) this._nextIndex = this._currentIndex + 1;
        }
    }

    get shuffle() {
        return this._shuffle;
    }

    get videos() {
        if (this._shuffle === true) return this._videosShuffled;
        else return this._videos;
    }

    private addVideo(video: OldVideo) {
        // Add the video to the array and update the length
        this._videos.push(video);
        this._lengthUnplayed += 1;

        if (this._videosShuffled.length === 0) {
            this._videosShuffled.push(video);
        } else {
            const randomIndex = Math.floor(Math.random() * this._videosShuffled.length);
            this._videosShuffled.splice(randomIndex, 0, video);
        }
    }

    private addVideoFromID(id: string) {
        // Generate a new video object and call addVideo
        const newVideo = new OldVideo(id);
        this.addVideo(newVideo);
    }

    private addVideosFromURLs(urlArray: string[]) {
        // // Split the comma-separated list
        // var urlArray = urls.split(',');
        // // console.log("LENGTH" + urlArray.length);
        // if (urlArray.length == 1) {
        //     // If there's only one url in the list then don't add anything
        //     return;
        // }
        // Add the id from each url in turn
        for (const url of urlArray) {
            const id = getIDFromURL(url);
            this.addVideoFromID(id);
        }
        // Once all the videos are added, shuffle if needs be
    }

    private addVideosFromCSV(csv: string) {
        // // Split the comma-separated list
        const urlArray = csv.split(",");
        // console.log("LENGTH" + urlArray.length);
        if (urlArray.length === 1) {
            // If there's only one url in the list then don't add anything
            return;
        }
        this.addVideosFromURLs(urlArray);
    }

    addVideosCombo(inputData: string) {
        if (inputData.substring(0, 8) === "RMPLYLST") {
            // If we've got a playlist JSON on our hands
            const playlistJSON = JSON.parse(inputData.substring(8));
            for (const [url, details] of Object.entries(playlistJSON)) {
                const newVideo = new OldVideo((details as any).id, (details as any).title, (details as any).channel);
                newVideo.setIDFromURL(url);
                this.addVideo(newVideo);
            }
            return;
        } else {
            // If not, it'll probably be a CSV or single video
            const urlArray = inputData.split(","); // Split (the CSV)
            // If there's only one URL, add that
            // otherwise, pass the CSV to the handling function
            if (urlArray.length == 1) {
                const newVideo = new OldVideo("oof");
                newVideo.setIDFromURL(urlArray[0]);
                this.addVideo(newVideo);
            } else if (urlArray.length >= 1) {
                this.addVideosFromURLs(urlArray);
            }
        }
        return;
    }

    peekNextVideo() {
        if (this._shuffle) return this._videosShuffled[this._nextIndex];
        else return this._videos[this._nextIndex];
    }

    nextVideo() {
        // Ensure there are videos left to queue
        if (this._lengthUnplayed === 0) {
            console.error("No videos left.");
            return undefined;
            // throw Error;
        }
        if (this._shuffle === false) {
            // If we're not shuffling
            this._currentVideo = new OldVideo(
                this._videos[this._nextIndex].id,
                this._videos[this._nextIndex].title,
                this._videos[this._nextIndex].channel
            );
            // this._currentVideo = JSON.parse(JSON.stringify(this._videos[this._nextIndex]));  // Current video is the next video
        } else if (this._shuffle === true) {
            // If we're shuffling
            this._currentVideo = new OldVideo(
                this._videosShuffled[this._nextIndex].id,
                this._videosShuffled[this._nextIndex].title,
                this._videosShuffled[this._nextIndex].channel
            );
            // this._currentVideo = JSON.parse(JSON.stringify(this._videosShuffled[this._nextIndex]));
        }
        this._currentIndex = this._nextIndex; // Current index is the next index
        this._lengthUnplayed -= 1; // There is one less unplayed video
        this._lengthPlayed += 1;
        this._nextIndex += 1; // Increment the nextIndex if there are more videos left
        // else this.next = null;
        return this._currentVideo;
    }

    peekPreviousVideo() {
        if (this._shuffle)
            return new OldVideo(
                this._videosShuffled[this._currentIndex - 1].id,
                this._videosShuffled[this._currentIndex - 1].title,
                this._videosShuffled[this._currentIndex - 1].channel
            );
        else
            return new OldVideo(
                this._videos[this._currentIndex - 1].id,
                this._videos[this._currentIndex - 1].title,
                this._videos[this._currentIndex - 1].channel
            );
    }

    previousVideo() {
        // Ensure there are videos left to queue
        if (this._lengthPlayed <= 1) {
            console.error("No videos left.");
            return undefined;
            // throw Error;
        }
        if (this._shuffle === false) {
            // If we're not shuffling
            this._currentVideo = new OldVideo(
                this._videos[this._currentIndex - 1].id,
                this._videos[this._currentIndex - 1].title,
                this._videos[this._currentIndex - 1].channel
            );
            // this._currentVideo = JSON.parse(JSON.stringify(this._videos[this._nextIndex]));  // Current video is the next video
        } else if (this._shuffle === true) {
            // If we're shuffling
            this._currentVideo = new OldVideo(
                this._videosShuffled[this._currentIndex - 1].id,
                this._videosShuffled[this._currentIndex - 1].title,
                this._videosShuffled[this._currentIndex - 1].channel
            );
            // this._currentVideo = JSON.parse(JSON.stringify(this._videosShuffled[this._nextIndex]));
        }
        this._currentIndex -= 1; // Current index is the next index
        this._lengthUnplayed += 1; // There is one less unplayed video
        this._lengthPlayed -= 1;
        this._nextIndex -= 1; // Increment the nextIndex if there are more videos left
        // else this.next = null;
        return this._currentVideo;
    }

    empty() {
        this._videos = [];
        this._videosShuffled = [];
        this._currentIndex = -1;
        this._currentVideo = undefined;
        this._nextIndex = 0;
        this._lengthUnplayed = 0;
        this._lengthPlayed = 0;
        this.unplayedVideos = false;
    }

    private _generateShuffled() {
        this._videosShuffled = this._videos.slice(this._nextIndex);
        this._videosShuffled = shuffle(this._videosShuffled);
        if (this._currentIndex !== -1) {
            this._videosShuffled = [this._videos[this._currentIndex]].concat(this._videosShuffled);
        }
    }
}
