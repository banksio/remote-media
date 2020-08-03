const assert = require('assert');
const sinon = require('sinon');

const express = require('express');

const testHelpers = require('../src/test/setupFunctions');
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
});