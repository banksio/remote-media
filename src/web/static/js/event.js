export class event {
    constructor(event, data){
        this.broadcastEvents = {};
        this.sendEvents = {};

        if (event && data){
            this.addBroadcastEvent(event, data);
        }
    }

    addBroadcastEvent(event, data){
        if (event == undefined || data == undefined) throw Error("addBroadcastEvent requires two parameters");
        this.broadcastEvents[event] = data;
    }

    addSendEvent(event, data){
        if (event == undefined || data == undefined) throw Error("addSendEvent requires two parameters");
        this.sendEvents[event] = data;
    }

    addBroadcastEventFromConstruct(construct){
        this.addBroadcastEvent(construct.event, construct.data);
    }

    addSendEventFromConstruct(construct){
        this.addSendEvent(construct.event, construct.data);
    }
}

// class clientTransport extends event {
//     constructor(){
//         super()
//     }
// }

module.exports = { event }