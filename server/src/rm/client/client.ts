import { Video } from "../video";
import { State } from "./state";

export enum ClientType {Receiver, Admin}

export class Client {
    public id: string;
    private _name: string | undefined;
    public status: State;
    private _type: ClientType;
    // private _pingHistory: Array<any>;
    // private _cbStateChangeToRoom: CallableFunction | undefined;

    constructor(id: string, type: ClientType | undefined = ClientType.Receiver) {
        this.id = id;
        this._name = id;
        this.status = new State();
        // this._pingHistory = [];
        this._type = type;
        // this.status.stateChangeCallback = this.stateChangeCallbackToRoom.bind(this);
    }

    // ! Not currently using ping measurements
    // set ping(ping) {
    //     if (this._pingHistory.length >= 5) {
    //         this._pingHistory.shift();
    //     }
    //     this._pingHistory.push(ping);
    // }

    // get ping() {
    //     let totalPing = 0;
    //     let pingCount = 0;
    //     this._pingHistory.forEach(ping => {
    //         totalPing += ping;
    //         pingCount += 1;
    //     });
    //     let avgPing = totalPing / pingCount;
    //     return avgPing;
    // }

    public get name() {
        return this._name;
    }

    public set name(name) {
        this._name = name;
    }

    public get type() {
        return this._type
    }

    // public set stateChangeCallback(cb: CallableFunction) {
    //     this._cbStateChangeToRoom = cb;
    // }

    // stateChangeCallbackToRoom() {
    //     if (!this._cbStateChangeToRoom) throw new Error("oof");
    //     return this._cbStateChangeToRoom();
    // }
}
