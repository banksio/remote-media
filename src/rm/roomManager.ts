import { OldRoom, Room } from "./room";

interface RoomEntry {
    [key: string]: Room;
}

const rooms: RoomEntry = {};

export function getRoom(roomName: string): Room {
    return rooms[roomName];
}

export function addRoom(roomName: string): Room {
    const newRoom = new Room(roomName);

    if (!rooms[roomName]) rooms[roomName] = newRoom;
    else throw new Error("Room with the same name already exists.");
    return newRoom;
}
