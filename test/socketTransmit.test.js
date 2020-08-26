const assert = require('assert');

const testHelpers = require('../src/test/setupFunctions');
const customAssert = require('../src/test/assertion');
const transmit = require('../src/rm/socketTransmit');
const classes = require('../web/js/classes');
const socketMock = require('../src/test/socketMock');
const { event } = require("../web/js/event")
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
        socketIOServer = socketMock.start(() => {
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

    // Connection management
    it("Should broadcast the connection management command to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        var clientInRoom1 = new classes.Login("testID1", undefined, "testName1");
        var clientInRoom2 = new classes.Login("testID2", undefined, "testName2");

        room.addClient(clientInRoom1);
        room.addClient(clientInRoom2);
        let expected = "testString";

        var results = new customAssert.AssertMultiple(2, expected, () => { done(); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastConnectionManagement(room, expected); });

        client1.once("serverConnectionManagement", function (actual) {
            try {
                results.strictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("serverConnectionManagement", function (actual) {
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

    // Transport object
    it("Should send the transport object to client", function (done) {
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        let expected = {
            "data": "shouldbethis",
            "testArray": ["should", "contain", "this"],
            "testObj": {
                "recursive": 1
            }
        }

        let eventObj = new event();
        eventObj.addSendEvent("test", expected)

        room.io.on("connection", (socket) => {
            transmit.sendEventObject(room.io, socket.id, eventObj);
        })
        var client1 = io.connect("http://localhost:3000", ioOptions);

        client1.once("test", function (actual) {
            try {
                assert.deepStrictEqual(actual, expected)
            } catch (error) {
                return done(error);
            }
            done();
        })
    })

    // Connection management
    it("Should broadcast the transport object to all clients", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var client2 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);

        let expected = {
            "data": "shouldbethis",
            "testArray": ["should", "contain", "this"],
            "testObj": {
                "recursive": 1
            }
        }

        let eventObj = new event();
        eventObj.addBroadcastEvent("test", expected)

        var results = new customAssert.AssertMultiple(2, expected, () => { done(); });
        var socketCount = new customAssert.SocketCounter(2, () => { transmit.broadcastEventObject(room.io, eventObj); });

        client1.once("test", function (actual) {
            try {
                results.deepStrictEqual(actual)
            } catch (error) {
                return done(error);
            }
        })

        client2.once("test", function (actual) {
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
});