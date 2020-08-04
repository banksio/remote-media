var server = require('../../web/js/classes');


function setNicknameInRoom(client, nickname, room) {
    if (room.getAllClientNames().includes(nickname) == true) {
        throw new Error("Duplicate Nickname Error");
    } else {
        //Stops injection by replacing '<' & '>' with html code
        nickname = nickname.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        client.name = nickname;
    }

}

// Ensure the client is on the same video as the room
function validateClientVideo(videoID, room) {
    return videoID == room.currentVideo.id;
}

module.exports = {
    "setNicknameInRoom": setNicknameInRoom,
    "validateClientVideo": validateClientVideo
};