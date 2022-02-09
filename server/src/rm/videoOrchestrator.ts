import chalk from "chalk";
import { transport } from "..";
import { PlayerState } from "./client/state";
import { event } from "./event/event";
import { preloadVideo } from "./event/events";
import { playVideoEvent } from "./event/videoEvents";
import { debug, info } from "./logging";
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
    private _currentVideo: Video;

    constructor(room: Room) {
        this._state = ServerVideoState.Stopped;
        this._currentVideo = new Video("");
        this._room = room;
    }

    public async preloadVideo(videoID: string) {
        // Generate the preload event to send to the clients
        const newPreload = new event();
        const transportNewVideo = preloadVideo(new Video(videoID));
        newPreload.addBroadcastEventFromConstruct(transportNewVideo);

        const promises = [];
        for (const clientID of Object.keys(this._room.clients.getRecievers())) {
            const clientPreloaded = transport.sendClientEventWithCallback(clientID, transportNewVideo).then(clientReportedVideoID => {
                info(chalk.green(`Client ${clientID} finished preloading.`));
                if (clientReportedVideoID !== videoID) throw new Error("Client preloaded incorrect video ID");
            })
            promises.push(clientPreloaded);
        }

        Promise.all(promises)
            .then(_ => {
                info(chalk.greenBright("All receivers preloaded, playing video"));
                this.playVideo().then(() => {
                    info(`Video (${videoID}) playing`)
                });
            })
            .catch(err => console.error(err));


        // TODO: Change this to return something different
        return newPreload;
    }

    /**
     * Play the video and send the play command to all the connected clients
     * @returns A Promise.all() for each of the clients connected
     */
    public async playVideo() {
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
}
