import { event } from "./event";
import { getRoom } from "../roomManager";
import { getIDFromURL } from "../utils";
import { preloadVideo, roomClients } from "./events";
import { Video } from "../video";
import { transport } from "../..";
import { videoPlay } from "./videoPlay";
import { info } from "../logging";
import chalk from "chalk";

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
        for (const clientID of Object.keys(room.clients.getRecievers())) {
            const clientPreloaded = transport.sendClientEventWithCallback(clientID, transportNewVideo).then(videoID => {
                console.log(`Client ${clientID} finished preloading.`);
                if (videoID !== getIDFromURL(videoURL)) throw new Error("Client preloaded incorrect video ID");
            })
            promises.push(clientPreloaded);
        }
        Promise.all(promises)
            .then(_ => {
                info(chalk.green("All receivers preloaded, playing video"));
                videoPlay(roomName, clientID).then(() => {
                    info(`Video (${getIDFromURL(videoURL)}) playing`)
                });
            })
            .catch(err => console.error(err));
    });
};
