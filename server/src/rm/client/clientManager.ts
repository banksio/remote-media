import { Client } from "./client";

export class ClientManager {
    clients: any;

    constructor() {
        this.clients = {};
    }

    push(client: Client) {
        // Add client if not already existent
        if (!this.clients[client.id]) {
            this.clients[client.id] = client;
        }
    }

    remove(client: Client) {
        // Remove client if existent
        if (this.clients[client.id]) {
            delete this.clients[client.id];
        }
    }

    get length() {
        return Object.keys(this.clients).length;
    }
}
