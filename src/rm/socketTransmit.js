const logging = require('./logging');
const chalk = require('chalk');

function broadcastConnectionManagement(room, control){
    room.io.binary(false).emit("serverConnectionManagement", control);
    return;
}

function broadcastEventObject(io, eventObj) {
    for (let [event, data] of Object.entries(eventObj.broadcastEvents)) {
        JSON.stringify(data);  // This will catch and throw any circular references
        logging.debug(chalk.magentaBright(`Broadcast ${event}: ${data}`));
        io.binary(false).emit(event, data);
    }
}

function sendEventObject(io, clientID, eventObj) {
    for (let [event, data] of Object.entries(eventObj.sendEvents)) {
        JSON.stringify(data);  // This will catch and throw any circular references
        logging.debug(chalk.magenta(`Send ${event}: ${data}`));
        getSocketObjectFromServer(io, clientID).binary(false).emit(event, data);
    }
}

function getSocketObjectFromServer(io, clientID) {
    return io.of("/").connected[clientID];
}

module.exports = {
    broadcastConnectionManagement,
    broadcastEventObject,
    sendEventObject,
    getSocketObjectFromServer
}