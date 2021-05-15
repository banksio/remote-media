import chalk from "chalk";
import { Server, Socket } from "socket.io";
import { clientConnect, clientDisconnect } from "../rm/handlers";
import { debug } from "../rm/logging";
import { event, eventConstruct } from "../rm/event/event";
import { transport } from "./transport";

export class socketioTransport extends transport {
    public server: Server;

    constructor(expressServer: Express.Application) {
        super();
        this.server = new Server(expressServer);
    }

    broadcastEvent(eventObj: event): void {
        for (const [event, data] of Object.entries(eventObj.broadcastEvents)) {
            JSON.stringify(data); // This will catch and throw any circular references
            debug(chalk.magentaBright(`Broadcast ${event}: ${data}`));
            this.server.emit(event, data);
        }
    }

    sendClientEvent(clientID: string, eventObj: event): void {
        const socket = this.getSocketByClientID(clientID);

        for (const [event, data] of Object.entries(eventObj.sendEvents)) {
            JSON.stringify(data); // This will catch and throw any circular references
            debug(chalk.magenta(`Send ${event}: ${data}`));
            socket.emit(event, data);
        }
    }

    sendInvertedClientEvent(clientID: string, eventObj: event): void {
        const socket = this.getSocketByClientID(clientID);

        for (const [event, data] of Object.entries(eventObj.broadcastEvents)) {
            JSON.stringify(data); // This will catch and throw any circular references
            debug(chalk.magenta(`Broadcast (with exclusion) ${event}: ${data}`));
            socket.broadcast.emit(event, data);
        }
    }

    handleEvent(clientID: string, eventObj: event): void {
        this.sendClientEvent(clientID, eventObj);
        this.broadcastEvent(eventObj);
    }

    async sendClientEventWithCallback(clientID: string, event: eventConstruct): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const socket = this.getSocketByClientID(clientID);

            debug(chalk.magenta(`Send ${event.event}: ${event.data}`));
            socket.emit(event.event, event.data, (data: any) => {
                resolve(data);
            });
        });
    }

    private getSocketByClientID(clientID: string) {
        const socket = this.server.of("/").sockets.get(clientID);
        if (!socket) throw new Error("Client not found.");
        return socket;
    }
}

// Get socketio to listen to the webserver's connection
// Create a callback function to deal with each connection.
// The callback contains code to setup what happens whenever a named message is received
export function startServer(expressServer: Express.Application) {
    const socketIOServer = new socketioTransport(expressServer);

    socketIOServer.server.on("connection", (socket: Socket) => {
        // A new connection from a client
        clientConnect("default", socket.id);

        socket.on("disconnect", () => {
            clientDisconnect("default", socket.id);
        });
    });

    // defaultRoom.onRoomEvent(handlers.onRoomEvent);

    // defaultRoom.onClientEvent(handlers.onClientEvent);

    // defaultRoom.onNotClientEvent(handlers.onNotClientEvent);

    return socketIOServer;
}
