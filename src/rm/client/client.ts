import SocketIO from "socket.io";
import { State } from "./state";

export class Login {
    id: string;
    private _name: string | undefined;
    status: State;
    private _pingHistory: Array<any>;
    socket: SocketIO.Socket;
    private _cbStateChangeToRoom: CallableFunction | undefined;

    constructor(id: string, socket: SocketIO.Socket, name: string | undefined = undefined) {
        this.id = id;
        this._name = name;
        this.status = new State();
        this._pingHistory = [];
        this.socket = socket;

        this.status.stateChangeCallback = this.stateChangeCallbackToRoom.bind(this);
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

    public set stateChangeCallback(cb: CallableFunction) {
        this._cbStateChangeToRoom = cb;
    }

    stateChangeCallbackToRoom() {
        if (!this._cbStateChangeToRoom) throw new Error("oof");
        return this._cbStateChangeToRoom();
    }
}