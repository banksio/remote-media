import chalk from "chalk";
import { event } from "./event";
import { error, info } from "../logging";
import { getRoom } from "../roomManager";
import { roomClients } from "./events";

export const removeClient = async (roomName: string, clientID: string): Promise<event> => {
    const room = getRoom(roomName);

    // Remove the client
    info(chalk.cyan("[CliMgnt] " + clientID + " has disconnected."));
    try {
        room.removeClient(clientID);
    } catch (clientNotFound) {
        error(
            "[CliMgnt] " + clientID + " has disconnected, but could not be removed from the server."
        );
    }

    // Construct the appropriate event
    const removeClientResponse = new event();
    const clients = roomClients(roomName);
    removeClientResponse.addBroadcastEventFromConstruct(clients);

    return removeClientResponse;
};
