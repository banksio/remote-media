import { getRoom } from "../roomManager";
import { EventConstruct } from "./event";

export const roomClients = (roomName: string) => {
    const room = getRoom(roomName);

    const data: EventConstruct = {
        event: "serverClients",
        data: room.clients.getAll(),
    };
    return data;
};

    const data: EventConstruct = {
        event: "serverNewVideo",
        data: newID,
    };
    return data;
};
