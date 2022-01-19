type eventDict = {
    [key: string]: any;
};

export interface eventConstruct {
    event: string;
    data: any;
}

export interface eventData {
    role: "Player" | "Admin" | "Server";
    data: any;
}

/**
 * The event class
 * Used for storing events before they are sent
 */
export class event {
    broadcastEvents: eventDict;
    sendEvents: eventDict;
    events: eventDict;

    constructor(event?: string, data?: any) {
        this.broadcastEvents = {};
        this.sendEvents = {};
        this.events = {};

        if (event && data) {
            this.addBroadcastEvent(event, data);
        }
    }

    addEvent(event: string, data: any): void {
        this.broadcastEvents[event] = data;
    }

    addBroadcastEvent(event: string, data: any) {
        if (event === undefined || data === undefined)
            throw Error("addBroadcastEvent requires two parameters");
        this.broadcastEvents[event] = data;
    }

    addSendEvent(event: string, data: any) {
        if (event === undefined || data === undefined)
            throw Error("addSendEvent requires two parameters");
        this.sendEvents[event] = data;
    }

    addEventFromConstruct(construct: eventConstruct) {
        this.addEvent(construct.event, construct.data);
    }

    addBroadcastEventFromConstruct(construct: eventConstruct) {
        this.addBroadcastEvent(construct.event, construct.data);
    }

    addSendEventFromConstruct(construct: eventConstruct) {
        this.addSendEvent(construct.event, construct.data);
    }
}
