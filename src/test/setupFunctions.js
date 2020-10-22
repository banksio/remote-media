const classes = require('../rm/classes');

function roomWithTwoClients(io){
    var room = new classes.Room(io);
    var client1 = new classes.Login("fakeID1", undefined, "Client1");
    var client2 = new classes.Login("fakeID2", undefined, "Client2");

    room.addClient(client1);
    room.addClient(client2);
    
    return room;
}

module.exports = {
    roomWithTwoClients: roomWithTwoClients
}