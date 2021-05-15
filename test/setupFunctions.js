const classes = require("../src/rm/classes");

function roomWithTwoClients(io) {
    const room = new classes.Room(io);
    const client1 = new classes.Login("fakeID1", undefined, "Client1");
    const client2 = new classes.Login("fakeID2", undefined, "Client2");

    room.addClient(client1);
    room.addClient(client2);

    return room;
}

module.exports = {
    roomWithTwoClients: roomWithTwoClients,
};
