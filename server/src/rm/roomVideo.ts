import { Video } from "./video";

export class RoomVideo extends Video {
    constructor(video: Video) {
        super(video.id, video.title, video.channel, video.duration);
    }
}
