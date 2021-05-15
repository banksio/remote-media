import { event } from "./event";
import { getRoom } from "../roomManager";
import { getIDFromURL } from "../utils";
import { preloadVideo, roomClients } from "./events";
import { Video } from "../video";
import { transport } from "../..";
import { playVideo } from "./videoEvents";

export const videoPlay = async (roomName: string, clientID: string): Promise<void> => {
    const room = getRoom(roomName);

    const promises = [];
    for (const clientID of Object.keys(room.clients.getAll())) {
        promises.push(transport.sendClientEventWithCallback(clientID, playVideo()));
    }

    return Promise.all(promises)
        .then(results => {
            console.log(results);
        })
        .catch(err => console.error(err));
};
