import { debug } from './logging'
import chalk from 'chalk';
import SocketIO from 'socket.io';
import { event } from '../web/static/js/event';
import { Room } from './room';

export function broadcastConnectionManagement(room: Room, control: string){
    room.io.emit("serverConnectionManagement", control);
    return;
}

export function broadcastEventObject(io: any, eventObj: event) {
    for (let [event, data] of Object.entries(eventObj.broadcastEvents)) {
        JSON.stringify(data);  // This will catch and throw any circular references
        debug(chalk.magentaBright(`Broadcast ${event}: ${data}`));
        io.emit(event, data);
    }
}

export function sendEventObject(io: any, clientID: string, eventObj: event) {
    for (let [event, data] of Object.entries(eventObj.sendEvents)) {
        JSON.stringify(data);  // This will catch and throw any circular references
        debug(chalk.magenta(`Send ${event}: ${data}`));
        getSocketObjectFromServer(io, clientID).emit(event, data);
    }
}

export function broadcastNotClientEventObject(io: SocketIO.Server, clientID: string, eventObj: event) {
    for (let [event, data] of Object.entries(eventObj.broadcastEvents)) {
        JSON.stringify(data);  // This will catch and throw any circular references
        debug(chalk.magenta(`Broadcast (with exclusion) ${event}: ${data}`));
        getSocketObjectFromServer(io, clientID).broadcast.emit(event, data);
    }
}

export function getSocketObjectFromServer(io: SocketIO.Server, clientID: string): any {
    return io.of("/").sockets.get(clientID);
}
