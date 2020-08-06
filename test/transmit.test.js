const assert = require('assert');

const testHelpers = require('../src/test/setupFunctions');
const customAssert = require('../src/test/assertion');
const transmit = require('../src/rm/transmit');
const classes = require('../web/js/classes');
const mock = require('../src/test/socketMock');
// const remotemedia = require('../src/rm/server');

const io = require('socket.io-client');
const { Video } = require('../web/js/classes');
const ioOptions = {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
};

describe("transmit.js tests", function () {
    var socketIOServer;

    beforeEach(function (done) {
        socketIOServer = mock.start(() => {
            done();
        })
    })
    afterEach(function (done) {
        socketIOServer.close(() => {
            done()
        });
    })

    before(async () => {

    })

    after(async () => {

    })

    // Client array

    it("Should broadcast the client array", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);

        var room = testHelpers.roomWithTwoClients(socketIOServer);

        client1.once("serverClients", function (data) {
            assert.deepStrictEqual(data, room.clientsWithoutCircularReferences())
            done();
        })

        room.io.on("connection", () => {
            transmit.broadcastClients(room);
        })
    })

    it("Should broadcast the client array to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var clientCount = 0;
        var recievedCount = 0;

        var room = testHelpers.roomWithTwoClients(socketIOServer);
        // console.log(room.io)
        client1.once("serverClients", function (data) {
            assert.deepStrictEqual(data, room.clientsWithoutCircularReferences())
            recievedCount += 1;
            checkDone();
        })

        client2.once("serverClients", function (data) {
            assert.deepStrictEqual(data, room.clientsWithoutCircularReferences())
            recievedCount += 1;
            checkDone();
        })

        room.io.on("connection", () => {
            clientCount += 1;
            if (clientCount >= 2) {
                transmit.broadcastClients(room);
            }
        })

        function checkDone() {
            if (recievedCount >= 2) {
                done();
            }
        }
    })

    // Timestamp
    it("Should send the timestamp to client", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let timestamp = new Date().getTime()

        client1.once("serverVideoTimestamp", function (data) {
            try {
                assert.strictEqual(data, timestamp)
            } catch (error) {
                return done(error);
            }
            done();
        })

        room.io.on("connection", (socket) => {
            let clientInRoom = new classes.Login(socket.id, socket, "client1");

            transmit.sendIndividualTimestamp(clientInRoom, timestamp);
        })
    })

    it("Should broadcast the timestamp to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let timestamp = new Date().getTime()
        var results = new customAssert.AssertMultiple(2, timestamp, () => {
            done();
        });
        var socketCount = new customAssert.SocketCounter(2, () => {
            transmit.broadcastTimestamp(room, timestamp);
        });

        client1.once("serverVideoTimestamp", function (actual) {
            try {
                results.strictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("serverVideoTimestamp", function (actual) {
            try {
                results.strictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })
    })

    // Video preload
    it("Should broadcast the video ID to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle");
        let expected = { "value": video.id }
        var results = new customAssert.AssertMultiple(2, expected, () => {
            done();
        });
        var socketCount = new customAssert.SocketCounter(2, () => {
            transmit.broadcastPreloadVideo(room, video);
        });

        client1.once("serverNewVideo", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("serverNewVideo", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })
    })

    // Queue
    it("Should send the queue to client", function (done) {
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle", "testChannel", "testDuration");

        room.queue.addVideo(video)
        let expected = JSON.parse(JSON.stringify({
            "videos": room.queue.videos,
            "length": room.queue.length,
            "index": room.queue._currentIndex
        }));

        room.io.on("connection", (socket) => {
            let clientInRoom = new classes.Login(socket.id, socket, "client1");

            transmit.sendQueue(room, clientInRoom);
        })
        var client1 = io.connect("http://localhost:3000", ioOptions);

        client1.once("serverQueueVideos", function (actual) {
            try {
                assert.deepStrictEqual(actual, expected)
            } catch (error) {
                return done(error);
            }
            done();
        })
    })

    it("Should broadcast the queue to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle", "testChannel", "testDuration");

        room.queue.addVideo(video)
        let expected = JSON.parse(JSON.stringify({
            "videos": room.queue.videos,
            "length": room.queue.length,
            "index": room.queue._currentIndex
        }));

        var results = new customAssert.AssertMultiple(2, expected, () => { done(); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastQueue(room); });

        client1.once("serverQueueVideos", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("serverQueueVideos", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })
    })

    // Now playing
    it("Should send the queue status to client", function (done) {
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle", "testChannel", "testDuration");

        room.queue.addVideo(video)
        let expected = JSON.parse(JSON.stringify({
            shuffle: room.queue.shuffle
        }));

        room.io.on("connection", (socket) => {
            let clientInRoom = new classes.Login(socket.id, socket, "client1");

            transmit.sendQueueStatus(room, clientInRoom);
        })
        var client1 = io.connect("http://localhost:3000", ioOptions);

        client1.once("serverQueueStatus", function (actual) {
            try {
                assert.deepStrictEqual(actual, expected)
            } catch (error) {
                return done(error);
            }
            done();
        })
    })

    it("Should broadcast the queue status to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle", "testChannel", "testDuration");

        room.queue.addVideo(video)
        let expected = JSON.parse(JSON.stringify({
            shuffle: room.queue.shuffle
        }));

        var results = new customAssert.AssertMultiple(2, expected, () => { done(); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastQueueStatus(room); });

        client1.once("serverQueueStatus", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("serverQueueStatus", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })
    })

    // Now playing video
    it("Should send the now playing video to client", function (done) {
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle", "testChannel", "testDuration");

        let expected = JSON.stringify(video, video.cyclicReplacer);

        room.io.on("connection", (socket) => {
            let clientInRoom = new classes.Login(socket.id, socket, "client1");

            transmit.sendNowPlaying(room, clientInRoom, video);
        })
        var client1 = io.connect("http://localhost:3000", ioOptions);

        client1.once("serverCurrentVideo", function (actual) {
            try {
                assert.strictEqual(actual, expected)
            } catch (error) {
                return done(error);
            }
            done();
        })
    })

    it("Should broadcast the now playing video to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle", "testChannel", "testDuration");

        let expected = JSON.stringify(video, video.cyclicReplacer);

        var results = new customAssert.AssertMultiple(2, expected, () => { done(); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastNowPlaying(room, video); });

        client1.once("serverCurrentVideo", function (actual) {
            try {
                results.strictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("serverCurrentVideo", function (actual) {
            try {
                results.strictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })
    })

    // Player control
    it("Should broadcast the player control command to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        let expected = "play";

        var results = new customAssert.AssertMultiple(2, expected, () => { done(); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastPlayerControl(room, expected); });

        client1.once("serverPlayerControl", function (actual) {
            try {
                results.strictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("serverPlayerControl", function (actual) {
            try {
                results.strictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })
    })

    // Buffering clients
    it("Should broadcast the buffering clients to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        var clientInRoom1 = new classes.Login("testID1", undefined, "testName1");
        var clientInRoom2 = new classes.Login("testID2", undefined, "testName2");

        room.addClient(clientInRoom1);
        room.addClient(clientInRoom2);

        room.clients.testID2.status.updateState(3);
        let expected = JSON.parse(JSON.stringify(room.getBuffering()));

        var results = new customAssert.AssertMultiple(2, expected, () => { done(); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastBufferingClients(room, expected); });

        client1.once("serverBufferingClients", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("serverBufferingClients", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })
    })
    
    // Buffering if client was previously buffering, but is no longer
    it("Should broadcast the buffering clients to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        var clientInRoom1 = new classes.Login("testID1", undefined, "testName1");
        var clientInRoom2 = new classes.Login("testID2", undefined, "testName2");
        var state1 = new classes.State(3)
        state1.updateState(1);

        room.addClient(clientInRoom1);
        room.addClient(clientInRoom2);

        room.clients.testID2.status.updateState(3);
        let expected = JSON.parse(JSON.stringify(room.getBuffering()));

        var results = new customAssert.AssertMultiple(2, expected, () => { done(); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastBufferingIfClientNowReady(room, state1); });

        client1.once("serverBufferingClients", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("serverBufferingClients", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })
    })

    it("Should not broadcast the buffering clients to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        var clientInRoom1 = new classes.Login("testID1", undefined, "testName1");
        var clientInRoom2 = new classes.Login("testID2", undefined, "testName2");
        var state1 = new classes.State(1)
        state1.updateState(3);

        room.addClient(clientInRoom1);
        room.addClient(clientInRoom2);

        room.clients.testID2.status.updateState(3);
        let expected = JSON.parse(JSON.stringify(room.getBuffering()));

        new customAssert.AssertMultiple(2, expected, () => { done(assert.fail()); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastBufferingIfClientNowReady(room, state1); });

        client1.once("serverBufferingClients", function () {
            done(assert.fail());
        })

        client2.once("serverBufferingClients", function () {
            done(assert.fail());
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })

        done();
    })

    it("Should not broadcast the buffering clients to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        var clientInRoom1 = new classes.Login("testID1", undefined, "testName1");
        var clientInRoom2 = new classes.Login("testID2", undefined, "testName2");
        var state1 = new classes.State(1)
        state1.updateState(1);

        room.addClient(clientInRoom1);
        room.addClient(clientInRoom2);

        room.clients.testID2.status.updateState(3);
        let expected = JSON.parse(JSON.stringify(room.getBuffering()));

        new customAssert.AssertMultiple(2, expected, () => { done(assert.fail()); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastBufferingIfClientNowReady(room, state1); });

        client1.once("serverBufferingClients", function () {
            done(assert.fail());
        })

        client2.once("serverBufferingClients", function () {
            done(assert.fail());
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })

        done();
    })

    it("Should not broadcast the buffering clients to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        var clientInRoom1 = new classes.Login("testID1", undefined, "testName1");
        var clientInRoom2 = new classes.Login("testID2", undefined, "testName2");
        var state1 = new classes.State(3)
        state1.updateState(3);

        room.addClient(clientInRoom1);
        room.addClient(clientInRoom2);

        room.clients.testID2.status.updateState(3);
        let expected = JSON.parse(JSON.stringify(room.getBuffering()));

        new customAssert.AssertMultiple(2, expected, () => { done(assert.fail()); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastBufferingIfClientNowReady(room, state1); });

        client1.once("serverBufferingClients", function () {
            done(assert.fail());
        })

        client2.once("serverBufferingClients", function () {
            done(assert.fail());
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })

        done();
    })

    it("Should not broadcast the buffering clients to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        var clientInRoom1 = new classes.Login("testID1", undefined, "testName1");
        var clientInRoom2 = new classes.Login("testID2", undefined, "testName2");
        var state1 = new classes.State(3)

        room.addClient(clientInRoom1);
        room.addClient(clientInRoom2);

        room.clients.testID2.status.updateState(3);
        let expected = JSON.parse(JSON.stringify(room.getBuffering()));

        new customAssert.AssertMultiple(2, expected, () => { done(assert.fail()); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastBufferingIfClientNowReady(room, state1); });

        client1.once("serverBufferingClients", function () {
            done(assert.fail());
        })

        client2.once("serverBufferingClients", function () {
            done(assert.fail());
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })

        done();
    })

    // All clients
    it("Should broadcast all the clients to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        var clientInRoom1 = new classes.Login("testID1", undefined, "testName1");
        var clientInRoom2 = new classes.Login("testID2", undefined, "testName2");

        room.addClient(clientInRoom1);
        room.addClient(clientInRoom2);
        let expected = JSON.parse(JSON.stringify(room.clientsWithoutCircularReferences()));

        var results = new customAssert.AssertMultiple(2, expected, () => { done(); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastClients(room, expected); });

        client1.once("serverClients", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("serverClients", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        room.io.on("connection", () => {
            socketCount.incrementCount();
        })
    })

    // Currently playing video (only sent if playing)
    it("Should send the currently playing video to client", function (done) {
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle", "testChannel", "testDuration");
        room.currentVideo = video;
        room.currentVideo.state = 1;
        let expected = JSON.parse(JSON.stringify({ value: room.currentVideo.id }));

        room.io.on("connection", (socket) => {
            let clientInRoom = new classes.Login(socket.id, socket, "client1");

            transmit.sendCurrentVideoIfPlaying(room, clientInRoom);
        })
        var client1 = io.connect("http://localhost:3000", ioOptions);

        client1.once("serverNewVideo", function (actual) {
            try {
                assert.deepStrictEqual(actual, expected)
            } catch (error) {
                return done(error);
            }
            done();
        })
    })

    it("Should set the client as requiring a timestamp", function (done) {
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle", "testChannel", "testDuration");
        room.currentVideo = video;
        room.currentVideo.state = 1;

        room.io.on("connection", (socket) => {
            let clientInRoom = new classes.Login(socket.id, socket, "client1");

            transmit.sendCurrentVideoIfPlaying(room, clientInRoom);
            try {
                assert.ok(clientInRoom.status.requiresTimestamp);
            } catch (error) {
                return done(error);
            }
            done()
        })
        io.connect("http://localhost:3000", ioOptions);
    })

    it("Should not send the currently playing video to client", function (done) {
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle", "testChannel", "testDuration");
        room.currentVideo = video;
        room.currentVideo.state = 0;

        room.io.on("connection", (socket) => {
            let clientInRoom = new classes.Login(socket.id, socket, "client1");

            transmit.sendCurrentVideoIfPlaying(room, clientInRoom);
        })
        var client1 = io.connect("http://localhost:3000", ioOptions);

        client1.once("serverNewVideo", function () {
            done(assert.fail());
        })

        done();  // If the above done() is called, the test will fail. So it's safe for us to callback here.
    })

    it("Should not set the client as requiring a timestamp", function (done) {
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let video = new Video("testID", "testTitle", "testChannel", "testDuration");
        room.currentVideo = video;
        room.currentVideo.state = 0;

        room.io.on("connection", (socket) => {
            let clientInRoom = new classes.Login(socket.id, socket, "client1");

            transmit.sendCurrentVideoIfPlaying(room, clientInRoom);
            try {
                assert.ok(!clientInRoom.status.requiresTimestamp);
            } catch (error) {
                return done(error);
            }
            done();
        })
        io.connect("http://localhost:3000", ioOptions);
    })
});