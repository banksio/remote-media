import { put } from "../httpTransport";
import * as transmit from "./socketTransmit";

export const putVideo = async (videoID: string) => {
    const url = window.location.href;
    const arr = url.split("/");
    const result = arr[0] + "//" + arr[2];
    return put(result + "/api/video?client=" + transmit.socket.id, { videoID: videoID }).then(
        async response => {
            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error(await response.text());
                }
                throw new Error("Unhandled exception.");
            } else {
                return response.text();
            }
        }
    );
};
