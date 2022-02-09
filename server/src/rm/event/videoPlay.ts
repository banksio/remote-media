import { getRoom } from "../roomManager";

export const videoPlay = async (roomName: string, clientID: string): Promise<void> => {
    const room = getRoom(roomName);

    room.videoOrchestrator.playVideo();
};
