import chalk from "chalk";
import { event } from "./event";
import { Client } from "../client/client";
import { info } from "../logging";
import { getRoom } from "../roomManager";
import { roomClients } from "./events";

export const newClient = async (roomName: string, clientID: string): Promise<event> => {
    const room = getRoom(roomName);

    const newClient = new Client(clientID);
    info(chalk.green("[CliMgnt] New Client " + newClient.id));

    room.addClient(newClient);

    const newClientResponse = new event();
    // let queue = room.transportConstructs.queue();
    // let queueStatus = room.transportConstructs.queueStatus();
    // let video = room.transportConstructs.currentVideo();
    const clients = roomClients(roomName);
    newClientResponse.addBroadcastEventFromConstruct(clients);
    // newClientResponse.addSendEventFromConstruct(queue);
    // newClientResponse.addSendEventFromConstruct(queueStatus);

    // if (room.currentVideo.state == 1) {
    //     newClientResponse.addSendEventFromConstruct(video);
    // }

    newClientResponse.addSendEvent("initFinished", "1");
    // room._cbEvent(newClientResponse, this);
    // room._cbClientEvent(newClientResponse, this, newClient);
    return newClientResponse;
};
