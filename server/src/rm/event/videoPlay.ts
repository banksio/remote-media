import { event } from "./event";
import { getRoom } from "../roomManager";
import { getIDFromURL } from "../utils";
import { preloadVideo, roomClients } from "./events";
import { Video } from "../video";
import { transport } from "../..";
import { playVideoEvent } from "./videoEvents";

export const videoPlay = async (roomName: string, clientID: string): Promise<void> => {
    const room = getRoom(roomName);

    const promises = [];
    for (const clientID of Object.keys(room.clients.getAll())) {
        // Create a promise for each of the clients to preload the video
        // Check to ensure they have preloaded itt
        const clientPreloaded = transport.sendClientEventWithCallback(clientID, playVideoEvent()).then(data => {
            console.log("Callback recieved here!");
            // if (data) => {

            // }
            console.log(data);
        })
        promises.push(clientPreloaded);
    }

    return Promise.all(promises)
        .then(results => {
            console.log(results);
        })
        .catch(err => console.error(err));
};
