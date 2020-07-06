const assert = require('assert');

// Classes
var classes = require('../web/classes');
var rmUtils = require('../rmUtilities');

describe('Room client management tests', function () {
    it('Nickname setting function should throw as client already exists with same nickname', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        login.name = "Nick";
        room.addClient(login);
        room.addClient(login2);
        assert.throws(() => { rmUtils.setNicknameInRoom(login2, "Nick", room) }, Error);
    });

    it('Nickname setting function should not throw as client already exists with same nickname', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        login.name = "Nickname";
        room.addClient(login);
        room.addClient(login2);
        rmUtils.setNicknameInRoom(login2, "Nick", room);
        assert.equal(login2.name, "Nick");
    });
});