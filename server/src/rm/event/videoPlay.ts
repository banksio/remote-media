import { getRoom } from "../roomManager";

export const videoPlay = async (roomName: string, clientID: string, videoID: string): Promise<void> => {
    const room = getRoom(roomName);

    room.videoOrchestrator.playVideo(videoID);
};
