import chalk from "chalk";
import { transport } from "..";
import { PlayerState } from "./client/state";
import { event } from "./event/event";
import { preloadVideo, videoDetails } from "./event/events";
import { playVideoEvent } from "./event/videoEvents";
import { debug, info, error } from "./logging";
import { Room } from "./room";
import { getIDFromURL } from "./utils";
import { Video } from "./video";

export enum ServerVideoState {
    Stopped,
    Playing,
    Paused,
    Buffering,
    Preloading,
    Preloaded
}

export class VideoOrchestrator {
    private _room: Room;
    private _state: ServerVideoState;
    private _currentVideo: Video | undefined;

    constructor(room: Room) {
        this._state = ServerVideoState.Stopped;
        this._room = room;
    }

    public async preloadVideo(videoID: string): Promise<void> {
        // Generate the preload event to send to the clients
        const newPreload = new event();
        const transportNewVideo = preloadVideo(videoID);
        newPreload.addBroadcastEventFromConstruct(transportNewVideo);

        // Send to all admin panels
        for (const clientID of Object.keys(this._room.clients.getAdmins())) {
            const eventToSend = new event();
            eventToSend.addSendEventFromConstruct(transportNewVideo);
            transport.sendClientEvent(clientID, eventToSend);
        }

        // Send to all recievers
        const promises = [];
        for (const clientID of Object.keys(this._room.clients.getRecievers())) {
            const clientPreloaded = transport.sendClientEventWithCallback(clientID, transportNewVideo).then(videoDetails => {
                info(chalk.green(`Client ${clientID} finished preloading.`));
                if (videoDetails.id !== videoID) throw new Error("Client preloaded incorrect video ID");
                else {
                    try {
                        this.setVideo(new Video(videoID, videoDetails.title, videoDetails.channel, videoDetails.duration))
                    } catch (error) {
                        if (videoDetails.duration <= 0) throw error;
                    }
                }
            })
            promises.push(clientPreloaded);
        }

        Promise.all(promises)
            .then(_ => {
                info(chalk.greenBright("All receivers preloaded, playing video"));
                this.playVideo(videoID).then(() => {
                    info(`Video (${this._currentVideo?.id}) playing`)
                });
            })
            .catch(err => console.error(err));
    }

    /**
     * Play the video and send the play command to all the connected clients
     * @returns A Promise.all() for each of the clients connected
     */
    public async playVideo(videoIDVerification: string) {
        if (this._currentVideo === undefined || this._currentVideo.id !== videoIDVerification) {
            throw new Error("Video not properly preloaded, cannot play.")
        }

        const promises = [];

        for (const clientID of Object.keys(this._room.clients.getAll())) {
            // Create a promise for each of the clients to preload the video
            // Check to ensure they have preloaded it
            const clientPreloaded = transport.sendClientEventWithCallback(clientID, playVideoEvent()).then(data => {
                debug(chalk.green(`Client ${clientID} started playing.`));
                console.log(data);
            })
            promises.push(clientPreloaded);
        }

        return Promise.all(promises)
            .then(results => {
                console.log(results);
            })
            .catch(err => console.error(err));
    }

    pauseVideo() {

    }

    private setVideo(video: Video) {
        console.log("Video set in room");
        this._currentVideo = video;
        for (const clientID of Object.keys(this._room.clients.getAdmins())) {
            const videoDetailsEvent = new event();
            videoDetailsEvent.addSendEventFromConstruct(videoDetails(video))
            transport.sendClientEvent(clientID, videoDetailsEvent);
            console.log("Video sent to admin");
        }
    }
}
