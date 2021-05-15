import { getRoom } from "../roomManager";
import { event } from "./event";
import { roomClients } from "./events";

export const setReceiverNickname = async (
    roomName: string,
    clientID: string,
    nickname: string
): Promise<event> => {
    return new Promise<event>((resolve, reject) => {
        const room = getRoom(roomName);

        // Try and set the nickname
        try {
            room.clients.setClientNickname(clientID, nickname);
        } catch (error) {
            reject(error);
        }

        // Broadcast new client names, for admin panels
        const nicknameSetResponse = new event();
        nicknameSetResponse.addBroadcastEventFromConstruct(roomClients("default"));
        resolve(nicknameSetResponse);
    });
};
