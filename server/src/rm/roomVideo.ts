import { OldVideo } from "./video";

export class RoomVideo extends OldVideo {
    constructor(video: OldVideo) {
        super(video.id, video.title, video.channel, video.duration);
    }
}
