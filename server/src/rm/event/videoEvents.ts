import { eventConstruct } from "./event";

export const playVideo = () => {
    const data: eventConstruct = {
        event: "serverPlayerControl",
        data: "play",
    };
    return data;
};
