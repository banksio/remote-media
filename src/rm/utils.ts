import { Client } from "./client/client";
import { OldRoom, Room } from "./room";

export function setNicknameInRoom(client: Client, nickname: string, room: OldRoom): void {
    // Stops injection by replacing '<' & '>' with html code
    nickname = nickname.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (room.getAllClientNames().includes(nickname)) {
        throw new Error("Duplicate Nickname Error");
    } else {
        client.name = nickname;
    }
}

// Ensure the client is on the same video as the room
export function validateClientVideo(videoID: string, room: OldRoom): boolean {
    return videoID === room.currentVideo.id;
}

export function getIDFromURL(url: string): string {
    let id;

    const regex = /(?:\.be\/(.{11}?)(?:\?|$)|watch\?v=(.{11}?)(?:&|$|\n))/gi;
    let m;

    while ((m = regex.exec(url)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            if (groupIndex === 0) {
                return;
            }
            if (match === undefined) {
                return;
            }
            id = match;
            return;
        });
    }
    if (id === undefined) throw new Error("No video ID found in URL");
    return id;
}
