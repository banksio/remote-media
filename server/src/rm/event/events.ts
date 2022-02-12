import { getRoom } from "../roomManager";
import { Video, VideoDetails } from "../video";
import { EventConstruct } from "./event";

export const roomClients = (roomName: string) => {
    const room = getRoom(roomName);

    const data: EventConstruct = {
        event: "serverClients",
        data: room.clients.getAll(),
    };
    return data;
};

export const preloadVideo = (videoID: string) => {
    const data: EventConstruct = {
        event: "serverNewVideo",
        data: videoID,
    };
    return data;
};

export const videoDetails = (video: Video) => {
    const details: VideoDetails = {
        id: video.id,
        title: video.title,
        channel: video.channel,
        duration: video.duration
    }
    const data: EventConstruct = {
        event: "serverCurrentVideo",
        data: details,
    };
    return data;
};
