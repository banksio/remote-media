import { event } from "./event";
import { getRoom } from "../roomManager";
import { getIDFromURL } from "../utils";

export const videoForcePush = async (
    roomName: string,
    clientID: string,
    videoURL: string
): Promise<event> => {
    const room = getRoom(roomName);
    const videoID = getIDFromURL(videoURL);
    return room.videoOrchestrator.preloadVideo(videoID);
};
