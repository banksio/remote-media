var server = require('./web/classes');


function setNicknameInRoom(client, nickname, room) {
    if (room.getAllClientNames().includes(nickname) == true) {
        throw new Error("Validation Error");
    } else {
        client.name = nickname; 
    }   
}

module.exports = {
    "setNicknameInRoom": setNicknameInRoom
};