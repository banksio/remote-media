import { event } from "./event";
import { getRoom } from "../roomManager";
import { getIDFromURL } from "../utils";

export const videoForcePush = async (
    roomName: string,
    clientID: string,
    videoURL: string
): Promise<void> => {  // void promise, just return 200 as soon as this has completed
    const room = getRoom(roomName);
    const videoID = getIDFromURL(videoURL);
    room.videoOrchestrator.preloadVideo(videoID);
};
