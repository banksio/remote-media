import { getRoom } from "../roomManager";
import { Video } from "../video";
import { eventConstruct } from "./event";

export const roomClients = (roomName: string) => {
    const room = getRoom(roomName);

    const data: eventConstruct = {
        event: "serverClients",
        data: room.clients.getAll(),
    };
    return data;
};

export const preloadVideo = (video: Video) => {
    const newID = { value: video.id };

    const data: eventConstruct = {
        event: "serverNewVideo",
        data: newID,
    };
    return data;
};
