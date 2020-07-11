const { TouchBarScrubber } = require("electron");

class Room {
    constructor() {
        this.queue = new NewQueue();
        this.clients = {};
        this._currentVideo = new Video();
    }

    addClient(client) {
        // Only add a new client if it has a valid id
        if (client.id != undefined) {
            this.clients[client.id] = client;
        } else {
            throw "invalidClient";
        }
    }

    allPreloaded() {
        // If any clients are preloading then return false
        for (var i in this.clients) {
            if (this.clients[i].status.preloading == true) {
                return false;
            }
        }
        return true;
    }

    getBuffering() {
        // If any clients are buffering then return false
        let bufferingClients = [];
        for (var i in this.clients) {
            if (this.clients[i].status.state > 2) {
                bufferingClients.push(this.clients[i]);
            }
        }
        return bufferingClients;
    }

    removeClient(client) {
        // var clientIndex = this.clients.indexOf(client);
        // this.clients.splice(clientIndex, 1);
        delete this.clients[client.id];
    }

    set currentVideo(video){
        clearTimeout(this.currentVideo._cbWhenFinishedTimeout);
        this._currentVideo = video;
    }

    get currentVideo(){
        return this._currentVideo;
    }
}

class Login {
    constructor(id, name = undefined) {
        this.id = id;
        this._name = name;
        this.status = new State();
        this._pingHistory = [];
    }

    set ping(ping) {
        if (this._pingHistory.length >= 5) {
            this._pingHistory.shift();
        }
        this._pingHistory.push(ping);
    }

    get ping() {
        let totalPing = 0;
        let pingCount = 0;
        this._pingHistory.forEach(ping => {
            totalPing += ping;
            pingCount += 1;
        });
        let avgPing = totalPing / pingCount;
        return avgPing;
    }

    get name() {
        return this._name;
    }

    set name(name){
        this._name = name;
    }
}

class State {
    constructor(state = "Admin", preloading = false) {
        this.state = state;
        this.preloading = preloading;
        this.requiresTimestamp = false;
        this.playerLoading = true;
    }

    updateState(state) {
        this.state = state;
        // return this.cbStateChange();
    }

    updatePreloading(preloading) {
        this.preloading = preloading;
        // return this.cbStateChange();
    }

    updateStatus(newStatus) {
        this.state = newStatus.state;
        this.preloading = newStatus.preloading;
        // return this.cbStateChange();
        // this.timestamp = newStatus.timestamp;
    }

    friendlyState() {
        // Return the string of the current state name
    }

}

class RoomState extends State {
    constructor() {
        super(-2, false);
    }

    setCurrentVideo(video) {
        this.currentVideo = video;
    }
}

class Queue {
    constructor(shuffle = false) {
        this.videos = [];
        this.length = 0;
        this.shuffle = shuffle;
        this.name = "";
    }

    addVideo(video) {
        // Add the video to the array and update the length
        this.videos.push(video);
        this.length = this.videos.length;
    }

    addVideoFromID(id) {
        // Generate a new video object and call addVideo
        var newVideo = new Video(id);
        this.addVideo(newVideo);
    }

    addVideosFromURLs(urls) {
        // Split the comma-separated list
        var urlArray = urls.split(',');
        // console.log("LENGTH" + urlArray.length);
        if (urlArray.length == 1) {
            // If there's only one url in the list then don't add anything
            return;
        }
        // Add the id from each url in turn
        for (var url of urlArray) {
            var id = getIDFromURL(url);
            if (id != undefined) {
                this.addVideoFromID(id);
                // consoleLogWithTime(id);
            }
        }
    }

    popVideo() {
        // Ensure there are actually videos to pop
        if (this.videos.length <= 0) {
            return undefined;
        }
        // Are we shuffling?
        if (this.shuffle) {
            // We're shuffling, so get a random video
            var nextIndex = Math.floor(Math.random() * this.videos.length);  // Random from the queue
            console.log("[classes.js][ServerQueue] Queue is of length " + this.length);
            console.log("[classes.js][ServerQueue] The next queue video index is " + nextIndex);
            var nextVideo = this.videos[nextIndex];  // Get next video object
            this.videos.splice(nextIndex, 1);  // Remove from queue
            this.length = this.videos.length;  // Update queue length
            return nextVideo;
        } else {
            // Not shuffling, just get the next video
            let nextVideo = this.videos.shift();
            this.length = this.videos.length;  // Update queue length
            return nextVideo;
        }
    }

    empty() {
        // Reset video list, index and length
        this.videos = [];
        this.length = 0;
    }
}

class NewQueue {

    constructor(shuffle = false) {
        this._videos = [];
        this._videosShuffled = [];
        this._currentIndex = 0;
        this._currentVideo = undefined;
        this._nextIndex = 0;
        this._lengthUnplayed = 0;
        this._lengthPlayed = 0;
        this.unplayedVideos = false;
        this._shuffle = shuffle;
    }

    cyclicReplacer(key, value) {
        if (key == "_currentVideo") return undefined;
        else return value;
    }

    // set currentIndex(index){
    //     this._currentIndex = index;
    //     this.nextIndex = index + 1;
    // }

    // get currentIndex(){
    //     return this._currentIndex;
    // }

    // set nextIndex(index){
    //     this._nextIndex = index;
    // }

    // get nextIndex(){
    //     return this._nextIndex;
    // }

    get length(){
        return this._lengthUnplayed;
    }

    set shuffle(newShuffleValue){
        console.log("OOF SHUFFLE " + newShuffleValue);
        let oldShuffle = this._shuffle;
        this._shuffle = newShuffleValue;
        // If shuffle has been switched off
        if (oldShuffle == true && this._shuffle == false){
            // We need to find the current video in the regular array and set the current index to that
            // Find the index of the current video in the regular array
            this._currentIndex = this._videos.indexOf(this._videosShuffled[this._currentIndex]);
            // Set the number of unplayed videos in the regular playlist based on the new current index
            this._lengthUnplayed = this._videos.length - this._currentIndex - 1;
            this._lengthPlayed = this._videos.length - this._lengthUnplayed;
            // Set the next nextIndex if there are videos left after the current one
            if (this._lengthUnplayed != 0) this._nextIndex = this._currentIndex + 1;
        // If shuffle has been switched on
        } else /*if (this.oldShuffle == false && newShuffleValue == true)*/{
            this._generateShuffled();
            // console.log("OFOFOFOFOFOFOFOFOFOFOFOHHHHH" + this._videos);
            // We need to find the current video in the shuffled array and set the current index to that
            // Find the index of the current video in the regular array
            this._currentIndex = this._videosShuffled.indexOf(this._videos[this._currentIndex]);
            // Set the number of unplayed videos in the regular playlist based on the new current index
            this._lengthUnplayed = this._videosShuffled.length - this._currentIndex - 1;
            this._lengthPlayed = 1;
            // Set the next nextIndex if there are videos left after the current one
            if (this._lengthUnplayed != 0) this._nextIndex = this._currentIndex + 1;
        }
    }

    get shuffle(){
        return this._shuffle;
    }

    get videos(){
        if (this._shuffle == true) return this._videosShuffled;
        else return this._videos;
    }

    addVideo(video) {
        // Add the video to the array and update the length
        this._videos.push(video);
        this._lengthUnplayed++;

        if (this._videosShuffled.length == 0) {
            this._videosShuffled.push(video);
        } else {
            let randomIndex = Math.floor(Math.random() * this._videosShuffled.length);
            this._videosShuffled.splice(randomIndex, 0, video);
        }
    }

    addVideoFromID(id) {
        // Generate a new video object and call addVideo
        var newVideo = new Video(id);
        this.addVideo(newVideo);
    }

    addVideosFromURLs(urlArray) {
        // // Split the comma-separated list
        // var urlArray = urls.split(',');
        // // console.log("LENGTH" + urlArray.length);
        // if (urlArray.length == 1) {
        //     // If there's only one url in the list then don't add anything
        //     return;
        // }
        // Add the id from each url in turn
        for (var url of urlArray) {
            var id = getIDFromURL(url);
            if (id != undefined) {
                this.addVideoFromID(id);
                // consoleLogWithTime(id);
            }
        }
        // Once all the videos are added, shuffle if needs be

    }

    addVideosCombo(inputData){
        // If we've got a playlist JSON on our hands
        if (inputData.substring(0, 8) == "RMPLYLST"){
            let playlistJSON = JSON.parse(inputData.substring(8));
            for (let [url, details] of Object.entries(playlistJSON)) {
                let newVideo = new Video(undefined, details.title, details.channel);
                newVideo.setIDFromURL(url);
                this.addVideo(newVideo);
            }
            return;
        // If not, it'll probably be a CSV or single video
        } else {
            // Split the CSV
            var urlArray = inputData.split(',');
            // If there's only one URL, add that
            if (urlArray.length == 1) {
                let newVideo = new Video();
                newVideo.setIDFromURL(urlArray[0]);
                this.addVideo(newVideo);
            // If there's multiple URLs, pass the CSV to the handling function
            } else if (urlArray.length >= 1){
                this.addVideosFromURLs(urlArray);
            }
        }
        return;
    }

    peekNextVideo(){
        if (this._shuffle == false){  // If we're not shuffling
            return this._videos[this._nextIndex];
        } else if (this._shuffle == true) {  // If we're shuffling
            return this._videosShuffled[this._nextIndex];
        }
    }

    nextVideo(){
        // Ensure there are videos left to queue
        if (this._lengthUnplayed == 0){
            console.error("No videos left.");
            return undefined;
            throw Error;
        }
        if (this._shuffle == false){  // If we're not shuffling
            this._currentVideo = new Video(this._videos[this._nextIndex].id,this._videos[this._nextIndex].title,this._videos[this._nextIndex].channel);
            // this._currentVideo = JSON.parse(JSON.stringify(this._videos[this._nextIndex]));  // Current video is the next video
        } else if (this._shuffle == true) {  // If we're shuffling
            this._currentVideo = new Video(this._videosShuffled[this._nextIndex].id,this._videosShuffled[this._nextIndex].title,this._videosShuffled[this._nextIndex].channel)
            // this._currentVideo = JSON.parse(JSON.stringify(this._videosShuffled[this._nextIndex]));
        }
        this._currentIndex = this._nextIndex;  // Current index is the next index
        this._lengthUnplayed -= 1;  // There is one less unplayed video
        this._lengthPlayed += 1;
        this._nextIndex += 1; // Increment the nextIndex if there are more videos left
        // else this.next = null;
        return this._currentVideo;
    }

    peekPreviousVideo(){
        if (this._shuffle == false){  // If we're not shuffling
            return new Video(this._videos[this._currentIndex-1].id,this._videos[this._currentIndex-1].title,this._videos[this._currentIndex-1].channel);
        // this._currentVideo = JSON.parse(JSON.stringify(this._videos[this._nextIndex]));  // Current video is the next video
        } else if (this._shuffle == true) {  // If we're shuffling
            return new Video(this._videosShuffled[this._currentIndex-1].id,this._videosShuffled[this._currentIndex-1].title,this._videosShuffled[this._currentIndex-1].channel)
            // this._currentVideo = JSON.parse(JSON.stringify(this._videosShuffled[this._nextIndex]));
        }
    }

    previousVideo(){
        // Ensure there are videos left to queue
        if (this._lengthPlayed <= 1){
            console.error("No videos left.");
            return undefined;
            throw Error;
        }
        if (this._shuffle == false){  // If we're not shuffling
            this._currentVideo = new Video(this._videos[this._currentIndex-1].id,this._videos[this._currentIndex-1].title,this._videos[this._currentIndex-1].channel);
            // this._currentVideo = JSON.parse(JSON.stringify(this._videos[this._nextIndex]));  // Current video is the next video
        } else if (this._shuffle == true) {  // If we're shuffling
            this._currentVideo = new Video(this._videosShuffled[this._currentIndex-1].id,this._videosShuffled[this._currentIndex-1].title,this._videosShuffled[this._currentIndex-1].channel)
            // this._currentVideo = JSON.parse(JSON.stringify(this._videosShuffled[this._nextIndex]));
        }
        this._currentIndex -= 1;  // Current index is the next index
        this._lengthUnplayed += 1;  // There is one less unplayed video
        this._lengthPlayed -= 1;
        this._nextIndex -= 1; // Increment the nextIndex if there are more videos left
        // else this.next = null;
        return this._currentVideo;
    }

    empty(){
        this._videos = [];
        this._videosShuffled = [];
        this._currentIndex = 0;
        this._currentVideo = undefined;
        this._nextIndex = 0;
        this._lengthUnplayed = 0;
        this._lengthPlayed = 0;
        this.unplayedVideos = false;
    }

    _generateShuffled(){
        this._videosShuffled = this._videos.slice(this._nextIndex);
        this._videosShuffled = shuffle(this._videosShuffled);
        // console.log("                           " + this._currentIndex);
        this._videosShuffled = [this._videos[this._currentIndex]].concat(this._videosShuffled);
        // console.log(this._videosShuffled);
    }

}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // console.log("                               Length is " + currentIndex);
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    // console.log(array);
    return array;
  }

class Video {
    constructor(id = undefined, title = undefined, channel = undefined, duration = undefined) {
        this.id = id;
        this.title = title;
        this.channel = channel;
        this._duration = duration;
        this._state = 5;
        this.startingTime = 0;
        this.elapsedTime = 0;
        this._pausedSince = 0;
        this._pausedTime = 0;

    }

    cyclicReplacer(key, value) {
        if (key == "cbStateDelay") return undefined;
        else if (key == "_stateDelayInterval") return undefined;
        else if (key == "_cbWhenFinished") return undefined;
        else if (key == "_cbWhenFinishedTimeout") return undefined;
        else return value;
    }

    setIDFromURL(url) {
        this.id = getIDFromURL(url);
    }

    // Get the elapsed time of the video relative to the starting time
    getElapsedTime(currentTime = new Date().getTime()) {
        // this.elapsedTime = Math.round((currentTime - this.startingTime) / 1000);
        if (this._pausedSince != 0) {

        }
        if (this.startingTime == 0) {
            this.elapsedTime = 0;
            return 0;
        }
        this.elapsedTime = (((currentTime - this.startingTime) - this._pausedTime) / 1000);
        console.log("[classes.js][ServerVideo] The video's currently elapsed time is " + this.elapsedTime + " and has been paused for " + this._pausedTime / 1000);
        return this.elapsedTime;
    }

    set timestamp(ts) {
        this.startingTime = new Date().getTime() - (ts * 1000);
        this._pausedTime = 0;
        this._pausedSince = 0;
    }

    pauseTimer(time = new Date().getTime()) {
        this._pausedSince = time;  // Set the time of pausing
        console.log("[classes.js][ServerVideo] The video has been set paused.");
        // if (this._cbWhenFinishedTimeout){
        clearTimeout(this._cbWhenFinishedTimeout);
        console.log("DEBUGGGGGGGGGGGG The timeout has been cleared ");
        // }
    }

    resumeTimer(time = new Date().getTime()) {
        this._pausedTime += (time - this._pausedSince);
        this._pausedSince = 0;
        // Callback when the video has finished

        console.log("[classes.js][ServerVideo] The video has been resumed. It was paused for " + this._pausedTime);
    }

    whenFinished(cbWhenFinished) {
        this._cbWhenFinished = cbWhenFinished;
        return;
    }

    set duration(time) {
        this._duration = time * 1000;
        return;
    }

    get duration() {
        return this._duration;
    }

    get pausedTime() {
        if (this._pausedSince != 0) {
            return (this._pausedTime + (new Date().getTime() - this._pausedSince)) / 1000;
        }
        return this._pausedTime / 1000;
    }

    get state() {
        return this._state;
    }

    set state(newState) {
        this._state = newState;
        // console.log(this.startingTime);
        // console.log(this._state);
        // console.log(this._pausedSince);
        if (this.startingTime != 0) {  // If the video has elapsed time
            if (this.state != 1) {  // If the video is paused for buffering
                this.pauseTimer();
            } else if (this.state == 1) {  // If the video is playing
                if (this._pausedSince != 0) {  // And it was previously paused
                    this.resumeTimer();
                }
            }
        } else if (this.state == 1) {
            this.startingTime = new Date().getTime();

        }
        if (this.cbStateDelay) {
            this._stateDelayInterval = setTimeout(() => {
                if (this.state != 1) {
                    return this.cbStateDelay(this.state);
                }
            }, 2000);
            // clearInterval(1);
        }
        if (this.state == 1) {
            let oof0 = this.title;
            
            console.log(oof0 + " DEBUGGGGGGGGGGGG Cleared any existing timestamp");
            clearTimeout(this._cbWhenFinished);
            this.oof1 = (this._duration - (this.elapsedTime * 1000));
            this.oof2 = new Date().getTime();
            console.log(oof0 + " DEBUGGGGGGGGGGGG Set timeout to " + (this._duration - (this.elapsedTime * 1000)));
            this._cbWhenFinishedTimeout = setTimeout((id) => {
                console.log(oof0 + " THE VIDEO HAS FINISHED");
                console.log(oof0 + " OFFFFFFFFFFFFFFFFFFFFFFFFFOOOFFFFFFFFFFFFFFFFFFFFF" + ((new Date().getTime()) - this.oof2));
                console.log(oof0 + " " + this.oof1);
                return this._cbWhenFinished();
            }, (this._duration - (this.elapsedTime * 1000)), oof0);


        }
        if (this.cbPlaying) {
            return this.cbPlaying();
        }
        return;
    }
}

function getIDFromURL(url) {
    let id;

    const regex = /(?:\.be\/(.*?)(?:\?|$)|watch\?v=(.*?)(?:\&|$|\n))/ig;
    let m;

    while ((m = regex.exec(url)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            if (groupIndex == 0) {
                return "oof";
            }
            if (match == undefined) {
                return "oof";
            }
            // console.log(`Found match, group ${groupIndex}: ${match}`);
            id = match;

        });
    }
    // console.log(id);
    return id;
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = {
    "Room": Room,
    "Queue": Queue,
    "NewQueue": NewQueue,
    "Login": Login,
    "State": State,
    "Video": Video,
};