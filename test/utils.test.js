const assert = require('assert');

// Classes
var classes = require('../src/rm/classes');
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

describe('Utilties: ID from URL tests', function () {
    it('Should return the id from the URL', function () {
        let videoURL = "https://www.youtube.com/watch?v=FoSe_KAQEr8";
        let expected = "FoSe_KAQEr8";

        let actual = utils.getIDFromURL(videoURL);

        assert.strictEqual(actual, expected);
    });

    it('Should return the id from the URL with extra parameters', function () {
        let videoURL = "https://www.youtube.com/watch?v=BnO3nijfYmU&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=2&t=0s";
        let expected = "BnO3nijfYmU";

        let actual = utils.getIDFromURL(videoURL);

        assert.strictEqual(actual, expected);
    });

    it('Should return the id from the short URL', function () {
        let videoURL = "https://youtu.be/xi3c-9qzrPY";
        let expected = "xi3c-9qzrPY";

        let actual = utils.getIDFromURL(videoURL);

        assert.strictEqual(actual, expected);
    });

    it('Should return the id from the short URL with extra parameters', function () {
        let videoURL = "https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw";
        let expected = "xi3c-9qzrPY";

        let actual = utils.getIDFromURL(videoURL);

        assert.strictEqual(actual, expected);
    });
});