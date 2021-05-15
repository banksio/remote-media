import { put } from "../httpTransport.js";
import * as transmit from "./socketTransmit.js";

export const putVideo = async (videoID: string) => {
    const url = window.location.href;
    const arr = url.split("/");
    const result = arr[0] + "//" + arr[2];
    return put(result + "/api/video?client=" + transmit.socket.id, { videoID: videoID }).then(
        response => {
            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error("Name already taken.");
                }
                throw new Error("Unhandled exception.");
            } else {
                return response.text();
            }
        }
    );
};
