const assert = require("assert");

// Classes
const classes = require("../src/rm/classes");
const rmUtils = require("../src/rm/utils");
const utils = require("../src/rm/utils");

describe("Utilties: Nickname validation tests", () => {
    it("Should throw as client already exists with same nickname", () => {
        const room = new classes.Room();
        const loginID = "test";
        const loginID2 = "anotherTest";
        const login = new classes.Login(loginID);
        const login2 = new classes.Login(loginID2);
        login.name = "Nick";
        room.addClient(login);
        room.addClient(login2);

        assert.throws(() => {
            rmUtils.setNicknameInRoom(login2, "Nick", room);
        }, Error);
    });

    it("Should not throw as client already exists with same nickname", () => {
        const room = new classes.Room();
        const loginID = "test";
        const loginID2 = "anotherTest";
        const login = new classes.Login(loginID);
        const login2 = new classes.Login(loginID2);
        login.name = "Nickname";
        room.addClient(login);
        room.addClient(login2);
        rmUtils.setNicknameInRoom(login2, "Nick", room);

        assert.strictEqual(login2.name, "Nick");
    });

    it("Should replace html tags with gt and lt html codes", () => {
        const room = new classes.Room();
        const loginID = "test";
        const login = new classes.Login(loginID);
        room.addClient(login);
        rmUtils.setNicknameInRoom(login, "<h1>Injectable</h1>", room);

        assert.strictEqual(login.name, "&lt;h1&gt;Injectable&lt;/h1&gt;");
    });
});

describe("Utilties: Video validation tests", () => {
    it("Should return true as the two video IDs are the same", () => {
        const videoIDClient = "testID";
        const videoIDServer = "testID";
        const room = new classes.Room();
        const clientVideo = new classes.Video(videoIDClient);
        const serverVideo = new classes.Video(videoIDServer);
        room.currentVideo = serverVideo;

        assert.ok(utils.validateClientVideo(clientVideo.id, room));
    });
    it("Should return false as the two video IDs differ", () => {
        const videoIDClient = "testID";
        const videoIDServer = "differentTestID";
        const room = new classes.Room();
        const clientVideo = new classes.Video(videoIDClient);
        const serverVideo = new classes.Video(videoIDServer);
        room.currentVideo = serverVideo;

        assert.ok(!utils.validateClientVideo(clientVideo.id, room));
    });
});

describe("Utilties: ID from URL tests", () => {
    it("Should return the id from the URL", () => {
        const videoURL = "https://www.youtube.com/watch?v=FoSe_KAQEr8";
        const expected = "FoSe_KAQEr8";

        const actual = utils.getIDFromURL(videoURL);

        assert.strictEqual(actual, expected);
    });

    it("Should return the id from the URL with extra parameters", () => {
        const videoURL =
            "https://www.youtube.com/watch?v=BnO3nijfYmU&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=2&t=0s";
        const expected = "BnO3nijfYmU";

        const actual = utils.getIDFromURL(videoURL);

        assert.strictEqual(actual, expected);
    });

    it("Should return the id from the short URL", () => {
        const videoURL = "https://youtu.be/xi3c-9qzrPY";
        const expected = "xi3c-9qzrPY";

        const actual = utils.getIDFromURL(videoURL);

        assert.strictEqual(actual, expected);
    });

    it("Should return the id from the short URL with extra parameters", () => {
        const videoURL = "https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw";
        const expected = "xi3c-9qzrPY";

        const actual = utils.getIDFromURL(videoURL);

        assert.strictEqual(actual, expected);
    });
});
