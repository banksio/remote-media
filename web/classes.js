Object.prototype.allFalse = function() { 
    for (var i in this) {
        if (this[i] === true) return false;
    }
    return true;
}

class Room {
    constructor() {
        this.queue = new Queue();
        this.clients = {};
        this.currentVideo = new Video();
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
            if (this.clients[i].preloading === true) {
                return false;
            }
        }
        return true;
    }

    removeClient(client) {
        // var clientIndex = this.clients.indexOf(client);
        // this.clients.splice(clientIndex, 1);
        delete this.clients[client.id];
    }
}

class Login {
    constructor(id, name = undefined) {
        this.id = id;
        this.name = name;
        this.status = new State();
    }
}

class State {
    constructor(state = "Admin", preloading = false) {
        this.state = state;
        this.preloading = preloading;
        this.timestamp = undefined;
    }

    updateState(state) {
        this.state = state;
    }

    updatePreloading(preloading) {
        this.preloading = preloading;
    }

    updateStatus(newStatus) {
        this.state = newStatus.state;
        this.preloading = newStatus.preloading;
        this.timestamp = newStatus.timestamp;
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
            console.log(this.length);
            console.log(nextIndex);
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

class Video {
    constructor(id = undefined, title = undefined, channel = undefined, duration = undefined) {
        this.id = id;
        this.title = title;
        this.channel = channel;
        this.duration = duration;
        this.state = -1;
        this.startingTime = 0;
        this.elapsedTime = 0;
    }

    setIDFromURL(url) {
        this.id = getIDFromURL(url);
    }

    // Get the elapsed time of the video relative to the starting time
    getElapsedTime(currentTime) {
        this.elapsedTime = Math.round((currentTime - this.startingTime) / 1000);
        return this.elapsedTime;
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

module.exports = {
    "Room": Room,
    "Queue": Queue,
    "Login": Login,
    "State": State,
    "Video": Video,
};