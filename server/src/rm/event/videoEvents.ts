import { eventConstruct } from "./event";

export const playVideoEvent = () => {
    const data: eventConstruct = {
        event: "serverPlayerControl",
        data: "play",
    };
    return data;
};
