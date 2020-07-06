const assert = require('assert');

// Classes
var classes = require('../web/classes');

// Test video object ID parsing
describe('Video object URL parsing test', function () {
    let video = new classes.Video();
    beforeEach(function () {
        // video.id = undefined;
    });
    it('Short youtu.be - ID should be p47fEXGabaY', function () {
        video.setIDFromURL("https://youtu.be/p47fEXGabaY");
        assert.equal(video.id, "p47fEXGabaY");
    });
    it('Short youtu.be - ID should be ez1Kv8hiQGU', function () {
        video.setIDFromURL("https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");
        assert.equal(video.id, "ez1Kv8hiQGU");
    });
    it('Full length link - ID should be UBhdIcb84Hw', function () {
        video.setIDFromURL("https://www.youtube.com/watch?v=UBhdIcb84Hw");
        assert.equal(video.id, "UBhdIcb84Hw");
    });
    it('Full length link with playlist - ID should be UBhdIcb84Hw', function () {
        video.setIDFromURL("https://www.youtube.com/watch?v=xi3c-9qzrPY&list=RDMMEK_LN3XEcnw&index=11");
        assert.equal(video.id, "xi3c-9qzrPY");
    });
    it('Invalid video URL, should return undefined', function () {
        video.setIDFromURL("https://www.youtube.com/playlist?list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG");
        assert.equal(video.id, undefined);
    });
});

// Test video object timekeeping
describe('Video object timekeeping test', function () {
    this.timeout(15000);
    let video = new classes.Video();
    it('Time after 5 seconds',function (done) {
        let elapsedTime = 5000;
        video.startingTime = new Date().getTime();
        let timestamp = video.getElapsedTime(new Date(Date.now() + elapsedTime).getTime());
        done(assert.ok((4.980 < timestamp && timestamp < 5.020), video.getElapsedTime(new Date(Date.now() + elapsedTime).getTime())));
    });
    it('Time after 10 seconds',function (done) {
        let elapsedTime = 10000;
        video.startingTime = new Date().getTime();
        let timestamp = video.getElapsedTime(new Date(Date.now() + elapsedTime).getTime());
        done(assert.ok((9.980 < timestamp && timestamp < 10.020), video.getElapsedTime(new Date(Date.now() + elapsedTime).getTime())));
    });
});

// Queue tests
describe('Queue tests', function () {
    let video = new classes.Video("p47fEXGabaY");
    it('Add single video, expect correct video object and queue length', function () {
        let queue = new classes.Queue();
        queue.addVideo(video);
        assert.equal(queue.length, 1);
        assert.equal(queue.popVideo(), video);
        assert.equal(queue.length, 0);
    });
    it('Add single video from ID, expect correct video ID and queue length', function () {
        let queue = new classes.Queue();
        queue.addVideoFromID(video.id);
        assert.equal(queue.length, 1);
        assert.equal(queue.popVideo().id, video.id);
        assert.equal(queue.length, 0);
    });
    it('Add two videos from CSV test queue length, ID and pop from queue', function () {
        let queue = new classes.Queue();
        queue.addVideosFromURLs("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");
        assert.equal(queue.length, 2);
        assert.equal(queue.popVideo().id, "xi3c-9qzrPY");
        assert.equal(queue.length, 1);
        assert.equal(queue.popVideo().id, "ez1Kv8hiQGU");
        assert.equal(queue.length, 0);
    });
    it('Add one video from CSV, expect nothing added', function () {
        let queue = new classes.Queue();
        queue.addVideosFromURLs("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw");
        assert.equal(queue.length, 0);
        assert.equal(queue.popVideo(), undefined);
        assert.equal(queue.length, 0);
    });

    it('Add single video, get video from queue', function () {
        let queue = new classes.Queue();
        queue.addVideo(video);
        assert.equal(queue.getNextVideo(), video);
    });
});

// Test State object
describe('State object tests', function () {
    it('Test update state, expect state to be updated', function () {
        let state = new classes.State();
        state.updateState(1);
        assert.equal(state.state, 1);
        state.updateState(-1);
        assert.equal(state.state, -1);
    });
    it('Test update preloading, expect preloading to be updated', function () {
        let state = new classes.State();
        state.updatePreloading(false);
        assert.equal(state.preloading, false);
        state.updatePreloading(true);
        assert.equal(state.preloading, true);
    });
    it('Test update entire object, expect object to be updated', function () {
        let state = new classes.State();
        let newState = new classes.State();
        state.updateState(3);
        state.updatePreloading(true);
        newState.updateState(2);
        newState.updatePreloading(false);
        state.updateStatus(newState);
        assert.equal(state.state, 2);
        assert.equal(state.preloading, false);
        // assert.equal(state, newState);
    });
});

// Test Login object
describe('Login object tests', function () {
    it('Test constructor, expect id to be set', function () {
        let id = "test";
        let login = new classes.Login(id);
        assert(login.id, id);
    });
    it('Test constructor, expect name to be set', function () {
        let login = new classes.Login("test", "nameTest");
        assert(login.name, "nameTest");
    });
    it('Test constructor, expect State object to be created', function () {
        let login = new classes.Login("test");
        assert(login.status, new classes.State());
    });
});

// Room object tests
describe('Room object tests', function () {
    it('Test constructor, expect new Queue object', function () {
        let room = new classes.Room();
        assert(room.queue, new classes.Queue());
    });
    it('Test constructor, expect new Video object', function () {
        let room = new classes.Room();
        assert(room.currentVideo, new classes.Video());
    });
    it('Test addition of single client with valid ID, expect client to be added', function () {
        let room = new classes.Room();
        let loginID = "test";
        let login = new classes.Login(loginID);
        room.addClient(login);
        assert(room.clients[loginID], login);
    });
    it('Test addition of single client without valid ID, expect client to be rejected', function () {
        let room = new classes.Room();
        let login = new classes.Login();
        try {
            room.addClient(login); // this should fail
            assert.fail('invalidClient not thrown'); // this throws an AssertionError
          } catch (e) { // this catches all errors, those thrown by the function under test
                        // and those thrown by assert.fail
            if (e instanceof assert.AssertionError) {
              // bubble up the assertion error
              throw e;
            }
            assert.equal(e, "invalidClient");
          }
    });
});

// Room object tests
describe('Room status checking tests', function () {
    it('allPreloading should return true', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.addClient(login2);
        assert.ok(room.allPreloaded());
    });
    it('allPreloading should return false', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.clients[loginID].status.updatePreloading(true);
        room.addClient(login2);
        assert.equal(room.allPreloaded(), false);
    });
    it('allPreloading should return false', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.clients[loginID].status.updatePreloading(true);
        room.addClient(login2);
        room.clients[loginID2].status.updatePreloading(true);
        assert.equal(room.allPreloaded(), false);
    });
    it('removeClient should remove a client', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.addClient(login2);
        room.removeClient(login);
        assert.ok(typeof room.clients[login] == "undefined");
    });
});

// Room object tests
describe('Room client management tests', function () {
    it('Array should be ["Name1"]', function () {
        let room = new classes.Room();
        let loginID = "test";
        let login = new classes.Login(loginID);
        login.name = "Name1";
        room.addClient(login);
        let nameArray = room.getAllClientNames();
        assert.deepEqual(nameArray, ["Name1"]);
    });
    it('Array should be ["First", "21562"]', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        login.name = "First";
        login2.name = "21562";
        room.addClient(login);
        room.addClient(login2);
        let nameArray = room.getAllClientNames();
        assert.deepEqual(nameArray, ["First", "21562"]);
    });
    it('Array should be ["6172", "Crashed"]', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        login.name = "6172";
        login2.name = "Crashed";
        room.addClient(login);
        room.addClient(login2);
        let nameArray = room.getAllClientNames();
        assert.deepEqual(nameArray, ["6172", "Crashed"]);
    });
});