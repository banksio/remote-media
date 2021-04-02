import { Login } from "./client/client";
import { Room } from "./room";


export function setNicknameInRoom(client: Login, nickname: string, room: Room): void {
    if (room.getAllClientNames().includes(nickname) == true) {
        throw new Error("Duplicate Nickname Error");
    } else {
        //Stops injection by replacing '<' & '>' with html code
        nickname = nickname.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        client.name = nickname;
    }

}

// Ensure the client is on the same video as the room
export function validateClientVideo(videoID: string, room: Room): boolean {
    return videoID == room.currentVideo.id;
}

export function getIDFromURL(url: string): string {
    let id;

    const regex = /(?:\.be\/(.{11}?)(?:\?|$)|watch\?v=(.{11}?)(?:\&|$|\n))/ig;
    let m;

    while ((m = regex.exec(url)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            if (groupIndex == 0) {
                return "oof";
            }
            if (match == undefined) {
                return "oof";
            }
            // console.log(`Found match, group ${groupIndex}: ${match}`);
            id = match;
            return "oof";
        });
    }
    if (id == undefined) {
        throw new Error("No video ID found in URL.");
    }
    return id;
}

module.exports = {
    setNicknameInRoom,
    validateClientVideo,
    getIDFromURL
};