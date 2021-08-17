export class State {
    state: number;
    previousState: number;
    preloading: boolean;
    previousPreloading: boolean;
    requiresTimestamp: boolean;
    playerLoading: boolean;
    _cbStateChangeToClient: CallableFunction | undefined;
    isAdmin: boolean;

    constructor(state = 0, preloading = false, isAdmin = true) {
        this.state = state;
        this.previousState = state;
        this.preloading = preloading;
        this.previousPreloading = preloading;
        this.requiresTimestamp = false;
        this.playerLoading = true;
        this.isAdmin = isAdmin;
    }

    updateState(state: number) {
        this.previousState = this.state;
        this.state = state;
        if (this._cbStateChangeToClient) return this._cbStateChangeToClient();
        return;
    }

    updatePreloading(preloading: boolean) {
        this.previousPreloading = this.preloading;
        this.preloading = preloading;
        // return this.cbStateChange();
    }

    updateStatus(newStatus: State) {
        this.updateState(newStatus.state);
        this.updatePreloading(newStatus.preloading);
        // return this.cbStateChange();
        // this.timestamp = newStatus.timestamp;
    }

    friendlyState() {
        // Return the string of the current state name
    }

    set stateChangeCallback(cb: CallableFunction) {
        this._cbStateChangeToClient = cb;
    }
}
