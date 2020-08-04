const assert = require('assert');
const sinon = require('sinon');

const express = require('express');

const testHelpers = require('../src/test/setupFunctions');
const customAssert = require('../src/test/assertion');
const handlers = require('../src/rm/handlers');
const transmit = require('../src/rm/transmit');
const classes = require('../web/js/classes');
const mock = require('../src/test/socketMock');
// const remotemedia = require('../src/rm/server');

const io = require('socket.io-client');
const ioOptions = {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
};

describe("transmit.js tests", function () {
    var sender;
    var receiver;
    var client;
    var server;
    var expServer;
    var socketIOServer;

    beforeEach(function (done) {
        let expApp = express();
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

        client1.once("serverClients", function (data){
            assert.deepStrictEqual(data, room.clientsWithoutCircularReferences())
            done();
        })

        room.io.on("connection", (data) => {
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
        client1.once("serverClients", function (data){
            assert.deepStrictEqual(data, room.clientsWithoutCircularReferences())
            recievedCount += 1;
            checkDone();
        })

        client2.once("serverClients", function (data){
            assert.deepStrictEqual(data, room.clientsWithoutCircularReferences())
            recievedCount += 1;
            checkDone();
        })

        room.io.on("connection", (data) => {
            clientCount += 1;
            if (clientCount >= 2) {
                transmit.broadcastClients(room);
            }
        })

        function checkDone() {
            if (recievedCount >= 2){
                done();
            }
        }
    })

    it("Should send the timestamp to client", function (done) {
        var client1 = io.connect("http://localhost:3000", ioOptions);
        var room = testHelpers.roomWithTwoClients(socketIOServer);
        let timestamp = new Date().getTime()

        client1.once("serverVideoTimestamp", function (data){
            assert.strictEqual(data, timestamp)
            done();
        })

        room.io.on("connection", (socket) => {
            let clientInRoom = new classes.Login(socket.id, socket, "client1");

            transmit.sendIndividualTimestamp(clientInRoom, timestamp);
        })        
    })

    it("Should send the timestamp to all clients", function (done) {
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

        client1.once("serverVideoTimestamp", function (actual){
            results.strictEqual(actual)
        })

        client2.once("serverVideoTimestamp", function (actual){
            results.strictEqual(actual)
        })

        room.io.on("connection", (socket) => {
            let clientInRoom = new classes.Login(socket.id, socket, "client1");

            socketCount.incrementCount();
        })        
    })
});