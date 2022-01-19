import { event } from "../rm/event/event";

export type handlerFunction = (event: string, data: any) => void;

export interface incomingEventListeners {
    [event: string]: handlerFunction;
}

export abstract class transport {
    constructor() {}

    abstract broadcastEvent(eventObj: event): void;

    abstract sendClientEvent(clientID: string, eventObj: event): void;

    abstract sendInvertedClientEvent(clientID: string, eventObj: event): void;
}
