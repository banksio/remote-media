import { EventConstruct } from "./event";

export const playVideoEvent = () => {
    const data: EventConstruct = {
        event: "serverPlayerControl",
        data: "play",
    };
    return data;
};
