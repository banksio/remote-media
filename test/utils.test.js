const assert = require('assert');

// Classes
var classes = require('../web/js/classes');
var rmUtils = require('../src/rm/utils');
const utils = require('../src/rm/utils');

describe('Utilties: Nickname validation tests', function () {
    it('Should throw as client already exists with same nickname', function () {
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

    it('Should not throw as client already exists with same nickname', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        login.name = "Nickname";
        room.addClient(login);
        room.addClient(login2);
        rmUtils.setNicknameInRoom(login2, "Nick", room);
        assert.strictEqual(login2.name, "Nick");
    });

    it('Should replace html tags with gt and lt html codes', function () {
        let room = new classes.Room();
        let loginID = "test";
        let login = new classes.Login(loginID);
        room.addClient(login);
        rmUtils.setNicknameInRoom(login, "<h1>Injectable</h1>", room);
        assert.strictEqual(login.name, "&lt;h1&gt;Injectable&lt;/h1&gt;");
    });
});

describe('Utilties: Video validation tests', function () {
    it('Should return true as the two video IDs are the same', function () {
        let videoIDClient = "testID";
        let videoIDServer = "testID";
        let room = new classes.Room();
        let clientVideo = new classes.Video(videoIDClient);
        let serverVideo = new classes.Video(videoIDServer);
        room.currentVideo = serverVideo;
        assert.ok(utils.validateClientVideo(clientVideo.id, room));
    });
    it('Should return false as the two video IDs differ', function () {
        let videoIDClient = "testID";
        let videoIDServer = "differentTestID";
        let room = new classes.Room();
        let clientVideo = new classes.Video(videoIDClient);
        let serverVideo = new classes.Video(videoIDServer);
        room.currentVideo = serverVideo;
        assert.ok(!utils.validateClientVideo(clientVideo.id, room));
    });
});