import { event } from "./event";
import { getRoom } from "../roomManager";
import { getIDFromURL } from "../utils";
import { preloadVideo, roomClients } from "./events";
import { Video } from "../video";
import { transport } from "../..";
import { videoPlay } from "./videoPlay";

export const videoForcePush = async (
    roomName: string,
    clientID: string,
    videoURL: string
): Promise<event> => {
    return new Promise<event>((resolve, reject) => {
        const room = getRoom(roomName);

        // Check the name
        try {
            const videoID = getIDFromURL(videoURL);
        } catch (error) {
            reject(error);
        }

        // transmit.broadcastPreloadVideo(this, videoObj);
        const newPreload = new event();
        const transportNewVideo = preloadVideo(new Video(getIDFromURL(videoURL)));
        newPreload.addBroadcastEventFromConstruct(transportNewVideo);
        resolve(newPreload);

        const promises = [];
        for (const clientID of Object.keys(room.clients.getAll())) {
            promises.push(transport.sendClientEventWithCallback(clientID, transportNewVideo));
        }

        Promise.all(promises)
            .then(results => {
                console.log(results);
            })
            .catch(err => console.error(err));

        setTimeout(() => {
            videoPlay(roomName, clientID).then(() => {});
        }, 2000);

        // this.currentVideo = new ServerVideo("oof");
        // Object.assign(this.currentVideo, videoObj);
        // this.currentVideo.onPlayDelay(this.incomingEvents.videoStateDelay);
        // this.currentVideo.state = 5;
        // this.currentVideo.onStateChange(this.incomingEvents.videoStateChange);
        // this.currentVideo.whenFinished(this.incomingEvents.videoFinished);
    });
};
