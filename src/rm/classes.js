const chalk = require('chalk');
const logging = require('./logging');
const { event } = require("../../web/js/event");
const utils = require('./utils');
const rmErrors = require('./error');

class Room {
    constructor(io) {
        this.queue = new NewQueue();
        this.clients = {};
        this._currentVideo = new ServerVideo();
        this._bufferingClients = [];
        this.io = io;
        this._cbEvent = () => {console.error("Callback not set.")}
        this._cbClientEvent = () => {console.error("Callback not set.")}

        this.transportConstructs = {
            clients: () => {
                let data = {
                    "event": "serverClients",
                    "data": this.clientsWithoutCircularReferences()
                }
                return data;
            },
            bufferingClients: () => {
                let data = {
                    "event": "serverBufferingClients",
                    "data": this.getBuffering()
                }
                return data;
            },
            queue: () => {
                let queue = {
                    videos: this.queue.videos,
                    length: this.queue.length,
                    index: this.queue.currentIndex
                };

                let data = {
                    "event": "serverQueueVideos",
                    "data": queue
                }
                return data;
            },
            queueStatus: () => {
                let queueStatus = {
                    shuffle: this.queue.shuffle,
                    length: this.queue.length,
                    index: this.queue.currentIndex
                };

                let data = {
                    "event": "serverQueueStatus",
                    "data": queueStatus
                }
                return data;
            },
            newVideo: (videoObj) => {
                let newID = { "value": videoObj.id };
                let data = {
                    "event": "serverNewVideo",
                    "data": newID
                }
                return data;
            },
            currentVideo: () => {
                let data = {
                    "event": "serverCurrentVideo",
                    "data": JSON.stringify(this.currentVideo, this.currentVideo.cyclicReplacer)
                }
                return data;
            }
        }

        this.incomingEvents = {
            newClient: (socket) => {
                let newClient = this.addClient(new Login(socket.id, socket, socket.id));
                logging.info(chalk.green("[CliMgnt] New Client " + newClient.id));

                var newClientResponse = new event();
                let queue = this.transportConstructs.queue();
                let queueStatus = this.transportConstructs.queueStatus();
                let video = this.transportConstructs.currentVideo();
                let clients = this.transportConstructs.clients();
                newClientResponse.addBroadcastEventFromConstruct(clients);
                newClientResponse.addSendEventFromConstruct(queue);
                newClientResponse.addSendEventFromConstruct(queueStatus);

                if (this.currentVideo.state == 1) {
                    newClientResponse.addSendEventFromConstruct(video);
                }

                newClientResponse.addSendEvent("initFinished", "1");
                this._cbEvent(newClientResponse, this);
                this._cbClientEvent(newClientResponse, this, newClient);
                return newClient;
            },
            disconnectClient: (client) => {
                // Log removal
                logging.info(chalk.cyan("[CliMgnt] " + logging.prettyPrintClientID(client) + " has disconnected."));
                // Remove client
                this.removeClient(client);
                
                var removeClientResponse = new event();
                let clients = this.transportConstructs.clients();
                removeClientResponse.addBroadcastEventFromConstruct(clients);
                this._cbEvent(removeClientResponse, this);

                this.playIfPreloadingFinished();
                return;
            },
            queueControl: (data) => {
                let queueStatus;

                let queueControlResponse = new event();

                switch (data) {
                    case "prev":
                        this.playPrevInQueue();
                        return;
                    case "skip":
                        this.playNextInQueue();
                        return;
                    case "empty":
                        logging.debug("[ServerQueue] Emptying playlist");
                        this.queue.empty();
                        break;
                    case "toggleShuffle":
                        this.queueShuffleToggle();
                        logging.debug("[ServerQueue] Shuffle: " + this.queue.shuffle);
                        queueStatus = this.transportConstructs.queueStatus();
                        queueControlResponse.addBroadcastEventFromConstruct(queueStatus);
                        break;
                    default:
                        break;
                }
                // Broadcast the queue after any changes have been made
                let queue = this.transportConstructs.queue();
                queueControlResponse.addBroadcastEventFromConstruct(queue);
                this._cbEvent(queueControlResponse, this);
            },
            queueAppend: (data) => {
                try {
                    this.queue.addVideosCombo(data);  // Add videos to queue
                } catch (error) {
                    return error.message;
                }
                
                // Generate event for broadcasting to clients
                let queueAppendResponse = new event();
                let queue = this.transportConstructs.queue();
                queueAppendResponse.addBroadcastEventFromConstruct(queue);
                this._cbEvent(queueAppendResponse, this);
            },
            newVideo: (inputData) => {
                var urlArray = inputData.split(',');
                // If there's only one URL
                if (urlArray.length == 1) {
                    let newVideo = new Video();
                    try {
                        newVideo.setIDFromURL(urlArray[0]);
                    } catch (error) {
                        return error.message;
                    }
                    this.preloadNewVideoInRoom(newVideo);
                }
            },
            videoControl: (data) => {
                if (data == "pause") {
                    this.currentVideo.pauseVideo(false);
                }
                else if (data == "play") {
                    this.currentVideo.playVideo();
                }
                logging.debug("[VideoControl] Video Control: " + data);
            },
            receiverVideoDetails: (videoDetails, client) => {
                // If the video ID is not valid then return
                if (!utils.validateClientVideo(videoDetails.id, this)) {
                    logging.debug(chalk.yellow("[ServerVideo] Recieved invalid video details from " + logging.prettyPrintClientID(client)));
                    return 1;
                }
                // Assign the video details
                logging.debug(chalk.blueBright("[ServerVideo] Recieved video details from " + logging.prettyPrintClientID(client)));
                this.currentVideo.title = videoDetails.title;
                this.currentVideo.channel = videoDetails.channel;
                this.currentVideo.duration = videoDetails.duration;
                logging.debug("The video duration is " + videoDetails.duration);

                // Trigger event callback
                var videoDetailsEvent = new event();
                let video = this.transportConstructs.currentVideo();
                videoDetailsEvent.addBroadcastEventFromConstruct(video);
                this._cbEvent(videoDetailsEvent, this);
            },
            newTimestamp: (data, callback) => {
                let ts = data.timestamp;
                if (utils.validateClientVideo(data.videoID, this)) {
                    this.currentVideo.timestamp = ts;
                    this._cbEvent(new event("serverVideoTimestamp", ts), this);
                } else {
                    callback("Invalid Video");
                }
            },
            currentTimestampRequest: (data, callback) => {
                console.log(this.currentVideo.getElapsedTime());
                if (utils.validateClientVideo(data.videoID, this)) {
                    callback(this.currentVideo.getElapsedTime());
                } else {
                    callback(undefined, "Invalid Video");
                }
            },
            receiverReady: (client) => {
                logging.debug(chalk.cyan("[CliMgnt] " + logging.prettyPrintClientID(client) + " is ready. "));
                // Update the state in our server
                client.status.playerLoading = false;
                client.status.state = -1;

                // Is there currently a video playing on the server?
                // If there is, we should send it to the client.
                if (this.currentVideo.state != 0) {
                    // There is a video playing, so the client will need to preload it and then go to the timestamp
                    let newPreload = new event();
                    let transportNewVideo = this.transportConstructs.newVideo(this.currentVideo);
                    newPreload.addSendEventFromConstruct(transportNewVideo);
                    this._cbClientEvent(newPreload, this, client);
                    // This client needs a timestamp ASAP, this should be picked up by the status checking function
                    client.status.requiresTimestamp = true;
                    return 0;
                } else {
                    return 1;
                }
            },
            receiverNickname: (nick, client) => {
                // Set the nickname
                try {
                    utils.setNicknameInRoom(client, nick, this);
                } catch (error) {
                    if (error.message === "Duplicate Nickname Error") {
                        console.error(error);
                        return error.message;
                    }
                }
                
                // Update clients for admin panels
                var nicknameSetResponse = new event();
                let clients = this.transportConstructs.clients();
                nicknameSetResponse.addBroadcastEventFromConstruct(clients);
                this._cbEvent(nicknameSetResponse, this);

                logging.info(chalk.cyan("[CliNick] " + logging.prettyPrintClientID(client) + " has set their nickname."));
                return;
            },
            receiverPreloadingFinished: (videoID, client) => {
                // TODO: Needs further testing/refactoring
                // Ignore if it's the wrong video
                if (!utils.validateClientVideo(videoID, this)) {
                    logging.debug(chalk.yellow("[ClientVideo] " + logging.prettyPrintClientID(client) + " has finished preloading, but is on the wrong video."));
                    throw new Error("Wrong video");
                }

                client.status.updatePreloading(false);
                logging.debug(chalk.cyan("[ClientVideo] " + logging.prettyPrintClientID(client) + " has finished preloading."));

                // Play the video if the server is waiting to start a video and this was the last client we were waiting for
                if (this.playIfPreloadingFinished() == 0) {
                    return 0; // Don't continue with this function

                    // If the server is already playing a video
                }
                else if (this.sendTimestampIfClientRequires(client) == 0) {
                    return 0;
                }
                return 0;
            },
            receiverPlayerStatus: (data, client) => {
                // If the socket's not initialised, skip it
                // if (client.socket.id == undefined) {
                //     return -1;
                // }

                // If the client's on the wrong video, ignore this interaction
                if (!utils.validateClientVideo(data.videoID, this)) {
                    logging.debug(chalk.yellow("[receiver Status] Recieved status from " + logging.prettyPrintClientID(client) + " but wrong video."));
                    return 1
                }

                // Don't crash out if we can't get the current timestamp
                try {
                    logging.debug(chalk.blueBright("[ServerVideo] The current video timestamp is " + this.currentVideo.getElapsedTime()));
                }
                catch (error) {
                    console.error(error);
                }

                // Get the current state and use for logic
                let previousStatusState = client.status.state;

                // Debugging
                logging.debug("[ClientStatus]" + JSON.stringify(data));

                // Save the state and the preloading state
                let state = data.data.state;
                let preloading = data.data.preloading;

                client.status.updateState(state);
                client.status.updatePreloading(preloading);
                
                // Call a clients event, broadcast to all clients
                var clientsEvent = new event();
                let clients = this.transportConstructs.clients();
                clientsEvent.addBroadcastEventFromConstruct(clients);
                this._cbEvent(clientsEvent, this);

                logging.debug(chalk.cyan("[CliStatus] " + logging.prettyPrintClientID(client) + " has new status:" + " status: " + state + " preloading:" + preloading));

                // If the client is preloading, don't continue with this function
                if (preloading == true) {
                    return;
                }

                // If the client is buffering and everyone is preloaded
                if (client.status.state == 3 && this.allPreloaded()) {
                    // Add the socket to the array and pause all the clients
                    this._bufferingClients.push(client.id);
                    // sendPlayerControl("pause");
                    this.currentVideo.pauseVideo(true);
                    // defaultRoom.currentVideo.state = 3;
                    logging.debug("[BufferMgnt] " + logging.prettyPrintClientID(client) + " is buffering. The video has been paused.");
                // If client is playing
                } else if (client.status.state == 1 && this.allPreloaded()) {
                    // If anyone was previously listed as buffering
                    if (this._bufferingClients.length > 0) {
                        // Remove this client from the buffering array, they're ready
                        logging.debug("[BufferMgnt] " + logging.prettyPrintClientID(client) + " has stopped buffering.");
                        this._bufferingClients.splice(this._bufferingClients.indexOf(client.id), 1);
                        // If that means no one is buffering now, resume everyone
                        if (this._bufferingClients.length == 0) {
                            logging.debug("[BufferMgnt] No one is buffering, resuming the video.");
                            // sendPlayerControl("play");  // Play all the recievers
                            this.currentVideo.playVideo();
                            // defaultRoom.currentVideo.state = 1;  // Tell the server the video's now playing again
                        }
                    }
                }
        
                // if (previousStatusState == 3 && status.state != 3){
                //     broadcastBufferingClients(defaultRoom);
                // }

                // There'll be no state yet if the client hasn't yet recieved a video
                // if (state == undefined) {
                //     // Update the preloading status of the currentClient variable
                //     // currentClient.status.updatePreloading(preloading);
                //     // if (preloading) {
                //     //     anyPreloading = true;
                //     // }
                //     // logging.consoleLogWithTime(data)
                //     logging.consoleLogWithTime(defaultRoom.clients);
                //     // If everyone's preloaded, wait a millisecond then set the variable (not sure why the wait is here)
                //     return;
                // }
                // If there is a defined state,
                // Update the status of the current client
                // currentClient.status.updateStatus(status);
                // If the client buffers and no one's preloading,
                // if (status.state == 3 && defaultRoom.allPreloaded()) {
                //     // Add the socket to the array and pause all the clients
                //     buffering.push(socket.id);
                //     // sendPlayerControl("pause");
                //     defaultRoom.currentVideo.pauseVideo(true);
                //     // defaultRoom.currentVideo.state = 3;
                //     logging.consoleLogWithTime("[BufferMgnt] " + logging.prettyPrintClientID(currentClient) + " is buffering. The video has been paused.");
                // // If client is playing
                // } else if (status.state == 1) {
                //     // If anyone was previously listed as buffering
                //     if (buffering.length > 0) {
                //         // Remove this client from the buffering array, they're ready
                //         logging.consoleLogWithTime("[BufferMgnt] " + logging.prettyPrintClientID(currentClient) + " has stopped buffering.");
                //         buffering.splice(buffering.indexOf(socket.id), 1);
                //         // If that means no one is buffering now, resume everyone
                //         if (buffering.length == 0) {
                //             logging.consoleLogWithTime("[BufferMgnt] No one is buffering, resuming the video.");
                //             // sendPlayerControl("play");  // Play all the receivers
                //             defaultRoom.currentVideo.playVideo();
                //             // defaultRoom.currentVideo.state = 1;  // Tell the server the video's now playing again
                //         }
                //     }
                // }
                // if (previousStatusState == 3 && status.state != 3){
                //     broadcastBufferingClients(defaultRoom);
                // }
                // If the server has a video playing, client has finished playing and the queue is not empty
                // Status == 1 prevents the server getting confused when multiple clients respond
                // if (defaultRoom.currentVideo.state == 1 && status.state == 0 && defaultRoom.queue.length > 0) {
                //     logging.consoleLogWithTime("[ServerQueue] " + logging.prettyPrintClientID(currentClient) + " has finished. Playing the next video.");
                //     playNextInQueue(defaultRoom);
                // }
                this.broadcastBufferingIfClientNowReady(client.status);
            },
            videoStateChange: (state) => {
                logging.debug(chalk.blueBright("[ServerVideo] State " + state));
                switch (state) {
                    case 1:
                        this._cbEvent(new event("serverPlayerControl", "play"), this);
                        break;
                    case 2:
    
                    // break; Fall through
                    case 3:
                        this._cbEvent(new event("serverPlayerControl", "pause"), this);
                        break;
                    case 5:
    
                        break;
                    default:
                        break;
                }
            },
            videoStateDelay: (state) => {
                this.broadcastBufferingClients();
            },
            videoFinished: () => {
                // Video has finished.
                logging.debug(chalk.blueBright("[ServerVideo] The video has finished. Elapsed time: " + this.currentVideo.getElapsedTime()));
                // TODO: Test that this works
                // Try and play the next video in the queue
                // If there isn't a next video in the queue, tell the admin panel
                if (this.playNextInQueue() == undefined){
                    this._cbEvent(new event("serverQueueFinished", "data"), this);
                }
            }
        }

        this.events = {
            queueStatus: () => {
                // Send the new queue index etc.
                let queueControlResponse = new event();
                let queueStatus = this.transportConstructs.queueStatus();
                queueControlResponse.addBroadcastEventFromConstruct(queueStatus);
                this._cbEvent(queueControlResponse, this);
            }
        }
    }

    cyclicReplacer(key, value) {
        if (key == "io") return undefined;
        else if (key == "socket") return undefined;
        else return value;
    }

    clientsWithoutCircularReferences() {
        return JSON.parse(JSON.stringify(this.clients, this.cyclicReplacer))
    }

    addClient(client) {
        // Only add a new client if it has a valid id
        if (client.id != undefined) {
            this.clients[client.id] = client;
            this.clients[client.id].stateChangeCallback = this.stateChangeOfClient.bind(this);
            return this.clients[client.id];
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
                bufferingClients.push(JSON.parse(JSON.stringify(this.clients[i], this.cyclicReplacer)));
            }
        }
        return bufferingClients;
    }

    removeClient(client) {
        // var clientIndex = this.clients.indexOf(client);
        // this.clients.splice(clientIndex, 1);
        delete this.clients[client.id];
    }

    set currentVideo(video) {
        clearTimeout(this.currentVideo._cbWhenFinishedTimeout);
        this._currentVideo = video;
    }

    get currentVideo() {
        return this._currentVideo;
    }

    playIfPreloadingFinished() {
        // If there's a video cued
        if (this.currentVideo.state == 5) {
            // If everyone's preloaded, play the video
            if (this.allPreloaded()) {
                if (this.currentVideo.duration == 0) {
                    logging.debug("[Preload] Video details not recieved, cannot play video.");
                    return 2;  // Error
                }
                // Set all the receivers playing
                // sendPlayerControl("play");
                logging.debug("[Preload] Everyone has finished preloading, playing the video. allPreloaded: " + this.allPreloaded());
                // Set the server's video instance playing
                this.currentVideo.playVideo();
                // room.currentVideo.state = 1;
                // room.currentVideo.startingTime = new Date().getTime();
            }
        // No video cued
        } else {
            return 1;  // We're not trying to start a video, so don't continue with this function
        }
        return 0;  // We have started the video, all is good
    }

    // Set a new video playing on the server
    preloadNewVideoInRoom(videoObj) {
        // transmit.broadcastPreloadVideo(this, videoObj);
        let newPreload = new event();
        let transportNewVideo = this.transportConstructs.newVideo(videoObj)
        newPreload.addBroadcastEventFromConstruct(transportNewVideo);
        this._cbEvent(newPreload, this);

        this.currentVideo = new ServerVideo();
        Object.assign(this.currentVideo, videoObj);
        this.currentVideo.onPlayDelay(this.incomingEvents.videoStateDelay);
        this.currentVideo.state = 5;
        this.currentVideo.onStateChange(this.incomingEvents.videoStateChange);
        this.currentVideo.whenFinished(this.incomingEvents.videoFinished);
    }

    sendTimestampIfClientRequires(client) {
        // ? Would clients start playing at ts 0 when they shouldn't be playing yet (e.g. others still waiting)?
        if (this.currentVideo.state != 0 && client.status.requiresTimestamp) {
            // We'll send the client a timestamp so it can sync with the server
            client.status.requiresTimestamp = false;
            logging.debug(chalk.cyan("[ClientVideo] " + logging.prettyPrintClientID(client) + " requires a timestamp. Sending one to it now."));
            logging.debug(chalk.cyan("[CliMgnt] " + logging.prettyPrintClientID(client) + " has been sent a timestamp."));
            try {
                let timestampForClient = new event();
                timestampForClient.addSendEvent("serverVideoTimestamp", this.currentVideo.getElapsedTime());
                this._cbClientEvent(timestampForClient, this, client);
            } catch (error) {
                console.error(error);
            }
        } else {
            return 1;  // The client doesn't need a timestamp
        }
        return 0;  // Don't continue with this function
    }

    broadcastBufferingIfClientNowReady(status) {
        // If the client is no longer buffering (state was 3 or above but is now beneath 3)
        if (status.state < 3 && status.previousState >= 3) {
            this.broadcastBufferingClients();
        } else if (status.preloading == false && status.previousPreloading == true) {
            this.broadcastBufferingClients();
        }
    }

    broadcastBufferingClients() {
        let bufferingClients = new event();
        let bufferingClientsConstruct = this.transportConstructs.bufferingClients();
        bufferingClients.addBroadcastEventFromConstruct(bufferingClientsConstruct);
        this._cbEvent(bufferingClients, this);
    }

    queueShuffleToggle() {
        let queue = this.queue;
        queue.shuffle = !queue.shuffle;
        return queue.shuffle;
    }
    

    playNextInQueue() {
        let nextVideo = this.queue.nextVideo();
        if (nextVideo != undefined) {
            this.preloadNewVideoInRoom(nextVideo);
        }

        this.events.queueStatus();

        return nextVideo;
    }
    
    
    playPrevInQueue() {
        let nextVideo = this.queue.previousVideo();
        if (nextVideo != undefined) {
            this.preloadNewVideoInRoom(nextVideo);
        }

        this.events.queueStatus();

        return nextVideo;
    }

    getAllClientNames() {
        let ClientNames = [];
        for (var i in this.clients) {
            ClientNames.push(this.clients[i].name);
            // console.log("Client: " + this.clients[i].name);
        }
        return ClientNames;
    }

    stateChangeOfClient() {
        // console.log(chalk.cyan("[classes.js][Room] A client's state in the room has changed."));
        if (this._cbAnyClientStateChange) return this._cbAnyClientStateChange(this);
        return
    }

    // AnyClientStateChange(cb) {
    //     this._cbAnyClientStateChange = cb;
    // }

    onRoomEvent(cb){
        logging.debug(chalk.green("Room event callback set"))
        this._cbEvent = cb.bind(this);
    }

    onClientEvent(cb){
        logging.debug(chalk.green("Client event callback set"))
        this._cbClientEvent = cb.bind(this);
    }
}

class Login {
    constructor(id, socket, name = undefined) {
        this.id = id;
        this._name = name;
        this.status = new State();
        this._pingHistory = [];
        this.socket = socket;

        this.status.stateChangeCallback = this.stateChangeCallbackToRoom.bind(this);
    }

    // ! Not currently using ping measurements
    // set ping(ping) {
    //     if (this._pingHistory.length >= 5) {
    //         this._pingHistory.shift();
    //     }
    //     this._pingHistory.push(ping);
    // }

    // get ping() {
    //     let totalPing = 0;
    //     let pingCount = 0;
    //     this._pingHistory.forEach(ping => {
    //         totalPing += ping;
    //         pingCount += 1;
    //     });
    //     let avgPing = totalPing / pingCount;
    //     return avgPing;
    // }

    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;
    }

    set stateChangeCallback(cb) {
        this._cbStateChangeToRoom = cb;
    }

    stateChangeCallbackToRoom() {
        return this._cbStateChangeToRoom();
    }
}

class State {
    constructor(state = "Admin", preloading = false) {
        this.state = state;
        this.previousState = state;
        this.preloading = preloading;
        this.previousPreloading = preloading;
        this.requiresTimestamp = false;
        this.playerLoading = true;
    }

    updateState(state) {
        this.previousState = this.state;
        this.state = state;
        if (this._cbStateChangeToClient) return this._cbStateChangeToClient();
        return;
    }

    updatePreloading(preloading) {
        this.previousPreloading = this.preloading;
        this.preloading = preloading;
        // return this.cbStateChange();
    }

    updateStatus(newStatus) {
        this.updateState(newStatus.state);
        this.updatePreloading(newStatus.preloading);
        // return this.cbStateChange();
        // this.timestamp = newStatus.timestamp;
    }

    friendlyState() {
        // Return the string of the current state name
    }

    set stateChangeCallback(cb) {
        this._cbStateChangeToClient = cb;
    }

}

// class RoomState extends State {
//     constructor() {
//         super(-2, false);
//     }

//     setCurrentVideo(video) {
//         this.currentVideo = video;
//     }
// }

// class Queue {
//     constructor(shuffle = false) {
//         this.videos = [];
//         this.length = 0;
//         this.shuffle = shuffle;
//         this.name = "";
//     }

//     addVideo(video) {
//         // Add the video to the array and update the length
//         this.videos.push(video);
//         this.length = this.videos.length;
//     }

//     addVideoFromID(id) {
//         // Generate a new video object and call addVideo
//         var newVideo = new Video(id);
//         this.addVideo(newVideo);
//     }

//     addVideosFromURLs(urls) {
//         // Split the comma-separated list
//         var urlArray = urls.split(',');
//         // console.log("LENGTH" + urlArray.length);
//         if (urlArray.length == 1) {
//             // If there's only one url in the list then don't add anything
//             return;
//         }
//         // Add the id from each url in turn
//         for (var url of urlArray) {
//             var id = getIDFromURL(url);
//             if (id != undefined) {
//                 this.addVideoFromID(id);
//                 // consoleLogWithTime(id);
//             }
//         }
//     }

//     popVideo() {
//         // Ensure there are actually videos to pop
//         if (this.videos.length <= 0) {
//             return undefined;
//         }
//         // Are we shuffling?
//         if (this.shuffle) {
//             // We're shuffling, so get a random video
//             var nextIndex = Math.floor(Math.random() * this.videos.length);  // Random from the queue
//             console.log("[classes.js][ServerQueue] Queue is of length " + this.length);
//             console.log("[classes.js][ServerQueue] The next queue video index is " + nextIndex);
//             var nextVideo = this.videos[nextIndex];  // Get next video object
//             this.videos.splice(nextIndex, 1);  // Remove from queue
//             this.length = this.videos.length;  // Update queue length
//             return nextVideo;
//         } else {
//             // Not shuffling, just get the next video
//             let nextVideo = this.videos.shift();
//             this.length = this.videos.length;  // Update queue length
//             return nextVideo;
//         }
//     }

//     empty() {
//         // Reset video list, index and length
//         this.videos = [];
//         this.length = 0;
//     }
// }

class NewQueue {

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

    cyclicReplacer(key, value) {
        if (key == "_currentVideo") return undefined;
        else return value;
    }

    // set currentIndex(index){
    //     this._currentIndex = index;
    //     this.nextIndex = index + 1;
    // }

    get currentIndex(){
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
        let oldShuffle = this._shuffle;
        logging.debug("[Queue] Shuffle was " + oldShuffle)
        this._shuffle = newShuffle;
        logging.debug("[Queue] Shuffle is now " + this._shuffle)
        if (oldShuffle === true && this._shuffle === false) {  // If shuffle has been switched off
            // We need to find the current video in the regular array and set the current index to that
            // Find the index of the current video in the regular array
            this._currentIndex = this._videos.indexOf(this._videosShuffled[this._currentIndex]);
            // Set the number of unplayed videos in the regular playlist based on the new current index
            this._lengthUnplayed = this._videos.length - this._currentIndex - 1;
            this._lengthPlayed = this._videos.length - this._lengthUnplayed;
            // Set the next nextIndex if there are videos left after the current one
            if (this._lengthUnplayed != 0) this._nextIndex = this._currentIndex + 1;
        } else if (oldShuffle === false && this._shuffle === true) {  // If shuffle has been switched on
            this._generateShuffled();
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

    get shuffle() {
        return this._shuffle;
    }

    get videos() {
        if (this._shuffle == true) return this._videosShuffled;
        else return this._videos;
    }

    addVideo(video) {
        // Add the video to the array and update the length
        this._videos.push(video);
        this._lengthUnplayed += 1;

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
            var id = utils.getIDFromURL(url);
            this.addVideoFromID(id);
        }
        // Once all the videos are added, shuffle if needs be

    }

    addVideosFromCSV(csv) {
        // // Split the comma-separated list
        var urlArray = csv.split(',');
        // console.log("LENGTH" + urlArray.length);
        if (urlArray.length == 1) {
            // If there's only one url in the list then don't add anything
            return;
        }
        this.addVideosFromURLs(urlArray);
    }

    addVideosCombo(inputData) {
        if (inputData.substring(0, 8) == "RMPLYLST") {  // If we've got a playlist JSON on our hands
            let playlistJSON = JSON.parse(inputData.substring(8));
            for (let [url, details] of Object.entries(playlistJSON)) {
                let newVideo = new Video(undefined, details.title, details.channel);
                newVideo.setIDFromURL(url);
                this.addVideo(newVideo);
            }
            return;
        } else {  // If not, it'll probably be a CSV or single video
            var urlArray = inputData.split(',');  // Split (the CSV)
            // If there's only one URL, add that
            // otherwise, pass the CSV to the handling function
            if (urlArray.length == 1) {
                let newVideo = new Video();
                newVideo.setIDFromURL(urlArray[0]);
                this.addVideo(newVideo);
            } else if (urlArray.length >= 1) {
                this.addVideosFromURLs(urlArray);
            }
        }
        return;
    }

    peekNextVideo() {
        if (this._shuffle == false) {  // If we're not shuffling
            return this._videos[this._nextIndex];
        } else if (this._shuffle == true) {  // If we're shuffling
            return this._videosShuffled[this._nextIndex];
        }
    }

    nextVideo() {
        // Ensure there are videos left to queue
        if (this._lengthUnplayed == 0) {
            console.error("No videos left.");
            return undefined;
            // throw Error;
        }
        if (this._shuffle == false) {  // If we're not shuffling
            this._currentVideo = new Video(this._videos[this._nextIndex].id, this._videos[this._nextIndex].title, this._videos[this._nextIndex].channel);
            // this._currentVideo = JSON.parse(JSON.stringify(this._videos[this._nextIndex]));  // Current video is the next video
        } else if (this._shuffle == true) {  // If we're shuffling
            this._currentVideo = new Video(this._videosShuffled[this._nextIndex].id, this._videosShuffled[this._nextIndex].title, this._videosShuffled[this._nextIndex].channel)
            // this._currentVideo = JSON.parse(JSON.stringify(this._videosShuffled[this._nextIndex]));
        }
        this._currentIndex = this._nextIndex;  // Current index is the next index
        this._lengthUnplayed -= 1;  // There is one less unplayed video
        this._lengthPlayed += 1;
        this._nextIndex += 1; // Increment the nextIndex if there are more videos left
        // else this.next = null;
        return this._currentVideo;
    }

    peekPreviousVideo() {
        if (this._shuffle == false) {  // If we're not shuffling
            return new Video(this._videos[this._currentIndex - 1].id, this._videos[this._currentIndex - 1].title, this._videos[this._currentIndex - 1].channel);
            // this._currentVideo = JSON.parse(JSON.stringify(this._videos[this._nextIndex]));  // Current video is the next video
        } else if (this._shuffle == true) {  // If we're shuffling
            return new Video(this._videosShuffled[this._currentIndex - 1].id, this._videosShuffled[this._currentIndex - 1].title, this._videosShuffled[this._currentIndex - 1].channel)
            // this._currentVideo = JSON.parse(JSON.stringify(this._videosShuffled[this._nextIndex]));
        }
    }

    previousVideo() {
        // Ensure there are videos left to queue
        if (this._lengthPlayed <= 1) {
            console.error("No videos left.");
            return undefined;
            // throw Error;
        }
        if (this._shuffle == false) {  // If we're not shuffling
            this._currentVideo = new Video(this._videos[this._currentIndex - 1].id, this._videos[this._currentIndex - 1].title, this._videos[this._currentIndex - 1].channel);
            // this._currentVideo = JSON.parse(JSON.stringify(this._videos[this._nextIndex]));  // Current video is the next video
        } else if (this._shuffle == true) {  // If we're shuffling
            this._currentVideo = new Video(this._videosShuffled[this._currentIndex - 1].id, this._videosShuffled[this._currentIndex - 1].title, this._videosShuffled[this._currentIndex - 1].channel)
            // this._currentVideo = JSON.parse(JSON.stringify(this._videosShuffled[this._nextIndex]));
        }
        this._currentIndex -= 1;  // Current index is the next index
        this._lengthUnplayed += 1;  // There is one less unplayed video
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

    _generateShuffled() {
        this._videosShuffled = this._videos.slice(this._nextIndex);
        this._videosShuffled = shuffle(this._videosShuffled);
        if (this._currentIndex != -1){
            this._videosShuffled = [this._videos[this._currentIndex]].concat(this._videosShuffled);
        }
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
    constructor(id = undefined, title = undefined, channel = "Unknown", duration = 0) {
        this.id = id;
        this.title = title ? title : id;
        this.channel = channel;
        this._duration = duration;
    }

    setIDFromURL(url) {
        this.id = utils.getIDFromURL(url);
        this.title = this.title ? this.title : this.id;
    }
}

class ServerVideo extends Video {
    constructor(id = undefined, title = undefined, channel = "Unknown", duration = undefined) {
        super(id, title, channel, duration);

        this._state = 5;  // The state of the video (matches the official YouTube API's states)
        this.startingTime = -1;  // The timestamp at which the video started
        this._elapsedTime = 0;  // The duration the video's been playing
        this._pausedSince = 0;  // The timestamp of when it was paused
        this._pausedTime = 0;  // The duration it's been paused
    }

    cyclicReplacer(key, value) {
        if (key == "cbStateDelay") return undefined;
        else if (key == "_stateDelayInterval") return undefined;
        else if (key == "_cbWhenFinished") return undefined;
        else if (key == "_cbWhenFinishedTimeout") return undefined;
        else if (key == "cbStateDelayRoomRef") return undefined;
        else return value;
    }
    set timestamp(ts) {
        logging.debug("[ServerVideo] Timestamp set to " + chalk.redBright(ts));
        if (ts < 0) {
            throw new rmErrors.ValueError("Video timestamp cannot be a negative value");
        }
        
        logging.debug(chalk.yellowBright("Received new timestamp of ") + ts)
        this.startingTime = new Date().getTime() - (ts);
        this._pausedTime = 0;
        this._pausedSince = 0;
        this.pauseVideo();
    }
    
    get duration() {
        return this._duration;
    }
    set duration(time) {
        this._duration = time;
        return;
    }

    get pausedTime() {
        if (this._pausedSince != 0) {
            return (this._pausedTime + (new Date().getTime() - this._pausedSince));
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
                    return this.cbStateDelay(this.state);
                }
            }, 2000);
            // clearInterval(1);
        }
        if (this._cbStateChange) {
            return this._cbStateChange(this.state);
        }
        return;
    }

    // Get the elapsed time of the video relative to the starting time
    getElapsedTime(currentTime = new Date().getTime()) {
        // this.elapsedTime = Math.round((currentTime - this.startingTime));
        if (this._state >= 2 && this._state <= 3 && this.startingTime != -1) {  // If the video is paused then we need to subract the two timestamps
            // console.log("this time was generated by method 1, " + this._pausedSince)
            return ((this._pausedSince - this.startingTime) - this._pausedTime)  // Get the elapsed time 
        }
        
        if (this._pausedSince != 0) {

        }
        if (this.startingTime == -1) {
            return 0;
        }
        // console.log(chalk.blueBright("[classes.js][ServerVideo] The video's currently elapsed time is " + this._elapsedTime + " and has been paused for " + this._pausedTime));
        // console.log("this time was generated by method 2, " + this._pausedTime)
        return ((currentTime - this.startingTime) - this._pausedTime);
    }

    pauseTimer(time = new Date().getTime()) {
        this._pausedSince = new Date().getTime();  // Set the time of pausing
        logging.info(chalk.yellowBright("[ServerVideo] The video has been set paused."));
        // if (this._cbWhenFinishedTimeout){
        clearTimeout(this._cbWhenFinishedTimeout);
        logging.debug("[ServerVideo] The timeout has been cleared ");
        // }
    }

    resumeTimer(time = new Date().getTime()) {
        if (this._pausedSince == 0) {
            throw new Error("The video was not paused, so the timer cannot be resumed")
        }
        this._pausedTime += (time - this._pausedSince);
        this._pausedSince = 0;
        // Callback when the video has finished

        logging.info(chalk.greenBright("[ServerVideo] The video has been resumed. It was paused for " + this._pausedTime));
    }

    whenFinished(cbWhenFinished) {
        this._cbWhenFinished = cbWhenFinished;
        return;
    }

    // Function to set the video playing
    playVideo() {
        if (this._state >= 2 && this._state <= 3) {  // If the video was previously paused
            this.resumeTimer();  // Resume the timer - This can only be run if the video was previously paused
        } else if (this._state == 5) {  // If the video was previously cued
            this.startingTime = new Date().getTime();  // Set the starting time of the video to now
        }
        // Play the video, use setter to trigger callbacks and timeouts
        this.state = 1;

        let oof0 = this.title;  // Debugging stuff

        // TODO: Ensure this is tested
        clearTimeout(this._cbWhenFinishedTimeout);  // Clear the video finishing timeout

        // Debug stuff
        logging.debug("[ServerVideo] " + oof0+ " Cleared any existing timestamp.");
        // this.oof1 = (this._duration - (this._elapsedTime));
        this.oof2 = new Date().getTime();
        // console.log(oof0 + " DEBUGGGGGGGGGGGG Set timeout to " + (this._duration - (this._elapsedTime)));

        logging.debug("[ServerVideo] New duration: " + this._duration);
        logging.debug("[ServerVideo] New elapsed time: " + this.getElapsedTime());
        this._timeRemainingSinceLastResumed = (this._duration - (this.getElapsedTime()));  // Set the time remaining

        // If there's a video finished callback set, set a timeout for when the video finishes
        if (this._cbWhenFinished) {
            this._cbWhenFinishedTimeout = setTimeout((id) => {  // , to call the callback
                logging.debug("[ServerVideo] " + oof0 + " THE VIDEO HAS FINISHED");
                logging.debug("[ServerVideo] " + oof0 + " OFFFFFFFFFFFFFFFFFFFFFFFFFOOOFFFFFFFFFFFFFFFFFFFFF" + ((new Date().getTime()) - this.oof2));
                logging.debug("[ServerVideo] " + oof0 + " " + this.oof1);
                this.state = 0;
                return this._cbWhenFinished();  // Call the callback
            }, this._timeRemainingSinceLastResumed, oof0);
        }
    }

    // Function to pause the video
    pauseVideo(buffer) {
        logging.debug("[ServerVideo] Video has been paused");
        this.pauseTimer();
        if (buffer) {
            this.state = 3;
        } else {
            this.state = 2;
        }
        return;
    }

    onPlayDelay(cb) {
        this.cbStateDelay = cb;
        // this.cbStateDelayRoomRef = room;
    }

    onStateChange(cbStateChange) {
        this._cbStateChange = cbStateChange;
        return;
    }
}

// class ReceiverTransport {
//     constructor(videoID, data) {
//         this.videoID = videoID
//         this.data = data
//     }
// }

module.exports = {
    "Room": Room,
    // "Queue": Queue,
    "NewQueue": NewQueue,
    "Login": Login,
    "State": State,
    "Video": Video,
    "ServerVideo": ServerVideo
};

// function makeid(length) {
//     var result = '';
//     var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     var charactersLength = characters.length;
//     for (var i = 0; i < length; i++) {
//         result += characters.charAt(Math.floor(Math.random() * charactersLength));
//     }
//     return result;
// }