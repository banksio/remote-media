import chalk from "chalk";
import SocketIO from "socket.io";
import { event } from "../web/static/js/event";
import { Login } from "./client/client";
import { State } from "./client/state";
import { debug, info, prettyPrintClientID } from "./logging";
import { NewQueue } from "./queue/queue";
import { setNicknameInRoom, validateClientVideo } from "./utils";
import { ServerVideo, Video } from "./video";

class ClientArray {
    clients: any;

    constructor(){
        this.clients = {}
    }

    push(client: Login) {
        // Add client if not already existent
        if (!this.clients[client.id]) {
            this.clients[client.id] = client;
        }
    }

    remove(client: Login) {
        // Remove client if existent
        if (this.clients[client.id]) {
            delete this.clients[client.id];
        }
    }

    get length() {
        return Object.keys(this.clients).length;
    }
}

export class Room {
    queue: NewQueue;
    clients: any;
    private _currentVideo: ServerVideo;
    private _bufferingClients: ClientArray;
    io: SocketIO.Server;
    private _cbEvent: CallableFunction;
    private _cbClientEvent: CallableFunction;
    private _cbNotClientEvent: CallableFunction;
    transportConstructs: any;
    incomingEvents: any;
    events: { queueStatus: () => void; };
    private _cbAnyClientStateChange: any;

    constructor(io: SocketIO.Server) {
        this.queue = new NewQueue();
        this.clients = {};
        this._currentVideo = new ServerVideo();
        this._bufferingClients = new ClientArray();
        this.io = io;
        this._cbEvent = () => {console.error("Callback not set.")}
        this._cbClientEvent = () => {console.error("Callback not set.")}
        this._cbNotClientEvent = () => {console.error("Callback not set.")}

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
            newVideo: (videoObj: Video) => {
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
            newClient: (socket: SocketIO.Socket) => {
                let newClient = this.addClient(new Login(socket.id, socket, socket.id));
                info(chalk.green("[CliMgnt] New Client " + newClient.id));

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
            disconnectClient: (client: Login) => {
                // Log removal
                info(chalk.cyan("[CliMgnt] " + prettyPrintClientID(client) + " has disconnected."));
                // Remove client
                this.removeClient(client);
                
                var removeClientResponse = new event();
                let clients = this.transportConstructs.clients();
                removeClientResponse.addBroadcastEventFromConstruct(clients);
                this._cbEvent(removeClientResponse, this);

                this.playIfPreloadingFinished();
                return;
            },
            queueControl: (data: any) => {
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
                        debug("[ServerQueue] Emptying playlist");
                        this.queue.empty();
                        break;
                    case "toggleShuffle":
                        this.queueShuffleToggle();
                        debug("[ServerQueue] Shuffle: " + this.queue.shuffle);
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
            queueAppend: (data: any) => {
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
            newVideo: (inputData: string) => {
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
            videoControl: (data: string) => {
                if (data == "pause") {
                    this.currentVideo.pauseVideo(false);
                }
                else if (data == "play") {
                    this.currentVideo.playVideo();
                }
                debug("[VideoControl] Video Control: " + data);
            },
            receiverVideoDetails: (videoDetails: any, client: Login) => {
                // If the video ID is not valid then return
                if (!validateClientVideo(videoDetails.id, this)) {
                    debug(chalk.yellow("[ServerVideo] Recieved invalid video details from " + prettyPrintClientID(client)));
                    return;
                }
                // Assign the video details
                debug(chalk.blueBright("[ServerVideo] Recieved video details from " + prettyPrintClientID(client)));
                this.currentVideo.title = videoDetails.title;
                this.currentVideo.channel = videoDetails.channel;
                this.currentVideo.duration = videoDetails.duration;
                debug("The video duration is " + videoDetails.duration);

                // Trigger event callback
                var videoDetailsEvent = new event();
                let video = this.transportConstructs.currentVideo();
                videoDetailsEvent.addBroadcastEventFromConstruct(video);
                this._cbEvent(videoDetailsEvent, this);
            },
            newTimestamp: (data: any, client: Login, callback: CallableFunction) => {
                let ts = data.timestamp;
                if (validateClientVideo(data.videoID, this)) {
                    this.currentVideo.timestamp = ts;
                    this._cbNotClientEvent(new event("serverVideoTimestamp", ts), this, client);
                    this.currentVideo.pauseVideo(true, false);
                } else {
                    callback("Invalid Video");
                }
            },
            currentTimestampRequest: (data: any, callback: CallableFunction) => {
                debug("[ServerVideo] Current elapsed time: " + this.currentVideo.getElapsedTime());
                if (validateClientVideo(data.videoID, this)) {
                    callback(this.currentVideo.getElapsedTime());
                } else {
                    callback(undefined, "Invalid Video");
                }
            },
            receiverReady: (client: Login) => {
                debug(chalk.cyan("[CliMgnt] " + prettyPrintClientID(client) + " is ready. "));
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
            receiverNickname: (nick: string, client: Login) => {
                // Set the nickname
                try {
                    setNicknameInRoom(client, nick, this);
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

                info(chalk.cyan("[CliNick] " + prettyPrintClientID(client) + " has set their nickname."));
                return;
            },
            receiverPreloadingFinished: (videoID: string, client: Login) => {
                // TODO: Needs further testing/refactoring
                // Ignore if it's the wrong video
                if (!validateClientVideo(videoID, this)) {
                    debug(chalk.yellow("[ClientVideo] " + prettyPrintClientID(client) + " has finished preloading, but is on the wrong video."));
                    throw new Error("Wrong video");
                }

                client.status.updatePreloading(false);
                debug(chalk.cyan("[ClientVideo] " + prettyPrintClientID(client) + " has finished preloading."));

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
            receiverPlayerStatus: (data: any, client: Login) => {
                // If the socket's not initialised, skip it
                // if (client.socket.id == undefined) {
                //     return -1;
                // }

                // If the client's on the wrong video, ignore this interaction
                if (!validateClientVideo(data.videoID, this)) {
                    debug(chalk.yellow("[receiver Status] Recieved status from " + prettyPrintClientID(client) + " but wrong video."));
                    return;
                }

                // Don't crash out if we can't get the current timestamp
                try {
                    debug(chalk.blueBright("[ServerVideo] The current video timestamp is " + this.currentVideo.getElapsedTime()));
                }
                catch (error) {
                    console.error(error);
                }

                // Get the current state and use for logic
                let previousStatusState = client.status.state;

                // Debugging
                debug("[ClientStatus]" + JSON.stringify(data));

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

                debug(chalk.cyan("[CliStatus] " + prettyPrintClientID(client) + " has new status:" + " status: " + state + " preloading:" + preloading));

                // If the client is preloading, don't continue with this function
                if (preloading == true) {
                    return;
                }

                // If the client is buffering and everyone is preloaded
                if (client.status.state == 3 && this.allPreloaded()) {
                    // Add the socket to the array and pause all the clients
                    this._bufferingClients.push(client);
                    // sendPlayerControl("pause");
                    this.currentVideo.pauseVideo(true);
                    // defaultRoom.currentVideo.state = 3;
                    info("[BufferMgnt] " + prettyPrintClientID(client) + " is buffering. The video has been paused.");
                // If client is playing
                } else if ((client.status.state == 1 || client.status.state == 2) && this.allPreloaded()) {
                    // If anyone was previously listed as buffering
                    if (this._bufferingClients.length > 0) {
                        // Remove this client from the buffering array, they're ready
                        debug("[BufferMgnt] " + prettyPrintClientID(client) + " has stopped buffering.");
                        this._bufferingClients.remove(client)
                        // If that means no one is buffering now, resume everyone
                        if (this._bufferingClients.length == 0) {
                            debug("[BufferMgnt] No one is buffering, resuming the video.");
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
                //     // consoleLogWithTime(data)
                //     consoleLogWithTime(defaultRoom.clients);
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
                //     consoleLogWithTime("[BufferMgnt] " + prettyPrintClientID(currentClient) + " is buffering. The video has been paused.");
                // // If client is playing
                // } else if (status.state == 1) {
                //     // If anyone was previously listed as buffering
                //     if (buffering.length > 0) {
                //         // Remove this client from the buffering array, they're ready
                //         consoleLogWithTime("[BufferMgnt] " + prettyPrintClientID(currentClient) + " has stopped buffering.");
                //         buffering.splice(buffering.indexOf(socket.id), 1);
                //         // If that means no one is buffering now, resume everyone
                //         if (buffering.length == 0) {
                //             consoleLogWithTime("[BufferMgnt] No one is buffering, resuming the video.");
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
                //     consoleLogWithTime("[ServerQueue] " + prettyPrintClientID(currentClient) + " has finished. Playing the next video.");
                //     playNextInQueue(defaultRoom);
                // }
                this.broadcastBufferingIfClientNowReady(client.status);
            },
            videoStateChange: (state: number, action = true) => {
                debug(chalk.blueBright("[ServerVideo] State " + state));
                if (action) {
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
                }

            },
            videoStateDelay: (state: any) => {
                this.broadcastBufferingClients();
            },
            videoFinished: () => {
                // Video has finished.
                debug(chalk.blueBright("[ServerVideo] The video has finished. Elapsed time: " + this.currentVideo.getElapsedTime()));
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

    cyclicReplacer(key: any, value: any) {
        if (key == "io") return undefined;
        else if (key == "socket") return undefined;
        else return value;
    }

    clientsWithoutCircularReferences() {
        return JSON.parse(JSON.stringify(this.clients, this.cyclicReplacer))
    }

    addClient(client: Login) {
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

    removeClient(client: Login) {
        // var clientIndex = this.clients.indexOf(client);
        // this.clients.splice(clientIndex, 1);
        delete this.clients[client.id];
    }

    set currentVideo(video) {
        video.clearFinishedTimeout();
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
                    debug("[Preload] Video details not recieved, cannot play video.");
                    return 2;  // Error
                }
                // Set all the receivers playing
                // sendPlayerControl("play");
                debug("[Preload] Everyone has finished preloading, playing the video. allPreloaded: " + this.allPreloaded());
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
    preloadNewVideoInRoom(videoObj: Video) {
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

    sendTimestampIfClientRequires(client: Login) {
        // ? Would clients start playing at ts 0 when they shouldn't be playing yet (e.g. others still waiting)?
        if (this.currentVideo.state != 0 && client.status.requiresTimestamp) {
            // We'll send the client a timestamp so it can sync with the server
            client.status.requiresTimestamp = false;
            debug(chalk.cyan("[ClientVideo] " + prettyPrintClientID(client) + " requires a timestamp. Sending one to it now."));
            debug(chalk.cyan("[CliMgnt] " + prettyPrintClientID(client) + " has been sent a timestamp."));
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

    broadcastBufferingIfClientNowReady(status: State) {
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

    onRoomEvent(cb: CallableFunction){
        debug(chalk.green("Room event callback set"))
        this._cbEvent = cb.bind(this);
    }

    onClientEvent(cb: CallableFunction){
        debug(chalk.green("Client event callback set"))
        this._cbClientEvent = cb.bind(this);
    }

    onNotClientEvent(cb: CallableFunction){
        debug(chalk.green("Room excluding client event callback set"))
        this._cbNotClientEvent = cb.bind(this);
    }
}