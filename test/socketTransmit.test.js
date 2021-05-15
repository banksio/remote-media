const assert = require("assert");

const testHelpers = require("../src/test/setupFunctions");
const customAssert = require("../src/test/assertion");
const transmit = require("../src/rm/socketTransmit");
const classes = require("../src/rm/classes");
const socketMock = require("../src/test/socketMock");
const { event } = require("../web/js/event");
// const remotemedia = require('../src/rm/server');

const io = require("socket.io-client");
const { Video } = require("../src/rm/classes");
const ioOptions = {
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
};

describe("transmit.js tests", () => {
    let socketIOServer;

    beforeEach(done => {
        socketIOServer = socketMock.start(() => {
            done();
        });
    });
    afterEach(done => {
        socketIOServer.close(() => {
            done();
        });
    });

    before(async () => {});

    after(async () => {});

    // Connection management
    it("Should broadcast the connection management command to all clients", done => {
        const client1 = io.connect("http://localhost:3000", ioOptions);
        const client2 = io.connect("http://localhost:3000", ioOptions);
        const room = testHelpers.roomWithTwoClients(socketIOServer);

        const clientInRoom1 = new classes.Login(
            "testID1",
            undefined,
            "testName1"
        );
        const clientInRoom2 = new classes.Login(
            "testID2",
            undefined,
            "testName2"
        );

        room.addClient(clientInRoom1);
        room.addClient(clientInRoom2);
        const expected = "testString";

        const results = new customAssert.AssertMultiple(2, expected, () => {
            done();
        });
        const socketCount = new customAssert.SocketCounter(2, () => {
            transmit.broadcastConnectionManagement(room, expected);
        });

        client1.once("serverConnectionManagement", actual => {
            try {
                results.strictEqual(actual);
            } catch (error) {
                return done(error);
            }
        });

        client2.once("serverConnectionManagement", actual => {
            try {
                results.strictEqual(actual);
            } catch (error) {
                return done(error);
            }
        });

        room.io.on("connection", () => {
            socketCount.incrementCount();
        });
    });

    // Transport object
    it("Should send the transport object to client", done => {
        const room = testHelpers.roomWithTwoClients(socketIOServer);

        const expected = {
            data: "shouldbethis",
            testArray: ["should", "contain", "this"],
            testObj: {
                recursive: 1,
            },
        };

        const eventObj = new event();
        eventObj.addSendEvent("test", expected);

        room.io.on("connection", socket => {
            transmit.sendEventObject(room.io, socket.id, eventObj);
        });
        const client1 = io.connect("http://localhost:3000", ioOptions);

        client1.once("test", actual => {
            try {
                assert.deepStrictEqual(actual, expected);
            } catch (error) {
                return done(error);
            }
            done();
        });
    });

    // Connection management
    it("Should broadcast the transport object to all clients", done => {
        const client1 = io.connect("http://localhost:3000", ioOptions);
        const client2 = io.connect("http://localhost:3000", ioOptions);
        const room = testHelpers.roomWithTwoClients(socketIOServer);

        const expected = {
            data: "shouldbethis",
            testArray: ["should", "contain", "this"],
            testObj: {
                recursive: 1,
            },
        };

        const eventObj = new event();
        eventObj.addBroadcastEvent("test", expected);

        const results = new customAssert.AssertMultiple(2, expected, () => {
            done();
        });
        const socketCount = new customAssert.SocketCounter(2, () => {
            transmit.broadcastEventObject(room.io, eventObj);
        });

        client1.once("test", actual => {
            try {
                results.deepStrictEqual(actual);
            } catch (error) {
                return done(error);
            }
        });

        client2.once("test", actual => {
            try {
                results.deepStrictEqual(actual);
            } catch (error) {
                return done(error);
            }
        });

        room.io.on("connection", () => {
            socketCount.incrementCount();
        });
    });
});
