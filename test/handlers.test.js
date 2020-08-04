// const assert = require('assert');
// const sinon = require('sinon');

// const express = require('express');

// const handlers = require('../src/rm/handlers');
// const transmit = require('../src/rm/handlers');
// const classes = require('../web/js/classes');
// const remotemedia = require('../src/rm/server');


// const io = require('socket.io-client');
// const ioOptions = {
//     transports: ['websocket'],
//     forceNew: true,
//     reconnection: false
// };
// const testMsg = 'HelloWorld';

// describe("newClient tests", function () {
//     var sender;
//     var receiver;
//     var client;
//     var server;
//     let room;
//     var expServer;

//     beforeEach(function (done) {

//         // start the io server
//         // server.httpNew(3000)
//         // connect two io clients
//         // sender = io('http://localhost:3000/', ioOptions)
//         // receiver = io('http://localhost:3000/', ioOptions)
//         // server = require('../src/test/socketMock').start(() => {
//         //     

//         // });
//         room = new classes.Room(server);
//         // finish beforeEach setup
//         let expApp = express();
//         expServer = expApp.listen(3000);
//         remotemedia.start(expServer, () => {
//             done();
//         });
//     })
//     afterEach(function (done) {

//         // disconnect io clients after each test
//         // sender.disconnect()
//         // receiver.disconnect()
//         client.disconnect();
//         expServer.close(() => {
//             done()
//         });
//     })

//     before(async () => {

//     })

//     after(async () => {

//     })

//     it("Should return the new client", function (done) {
//         let newClientInRoom = handlers.newClient(room, socket);
//         assert.strictEqual(newClientInRoom, room.clients[socket.id]);
//         done();
//     })

//     // it("Should add a new client to the room", function (done) {
//     //     server.on('connection', function (socket) {
//     //         handlers.newClient(room, socket);
//     //         assert.strictEqual(1, Object.keys(room.clients).length);
//     //         done();
//     //     })
        
//     // })

//     // it("Should add the correct client to the room", function (done) {
//     //     server.on('connection', function (socket) {
//     //         done();
//     //         handlers.newClient(room, socket);
//     //         assert.strictEqual(socket.id, room.clients[socket.id].id);
//     //     })
        
//     // })

//     // it("Should broadcast the new clients array", function (done) {
//     //     server.on('connection', function (socket) {
//     //         handlers.newClient(room, socket);
//     //     })

//     //     client.on("serverClients", function () {
//     //         done();
//     //     })
        
//     // })

//     // it('Clients should receive a message when the `message` event is emited.', function (done) {
//     //     sender.emit('message', testMsg)
//     //     console.log("oof1");
//     //     receiver.on('message', function (msg) {
//     //         // assert.strictEqual(msg, testMsg);
//     //         done()
//     //         console.log("oof2");
//     //     })
//     // });

// });
