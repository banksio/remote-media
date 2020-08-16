// const assert = require('assert');
// const sinon = require('sinon');

// const express = require('express');

// const handlers = require('../src/rm/handlers');
// const transmit = require('../src/rm/socketTransmit');
// const classes = require('../web/js/classes');
// const remotemedia = require('../src/rm/server');
// const socketMock = require('../src/test/socketMock');


// const io = require('socket.io-client');
// const { Room } = require('../web/js/classes');
// const ioOptions = {
//     transports: ['websocket'],
//     forceNew: true,
//     reconnection: false
// };
// const testMsg = 'HelloWorld';

// describe("handlers.js sandbox spy tests", function () {
//     var sender;
//     var receiver;
//     var client;
//     var server;
//     let room;
//     var expServer;
//     var socketIOServer;

//     const sandbox = sinon.createSandbox();

//     beforeEach(function (done) {
//         socketIOServer = socketMock.start(() => {
//             done();
//         })
//         sandbox.spy(transmit);
//     })
//     afterEach(function (done) {
//         socketIOServer.close(() => {
//             done()
//         });
//         sandbox.restore();
//     })

//     before(async () => {

//     })

//     after(async () => {

//     })

//     it("Should add new client to room", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             assert.deepStrictEqual(room.clients[socket.id], newClientInRoom);
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

//     it("Should broadcast clients", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;

//         room.io.on("connection", (socket) => {
//             handlers.clientConnect(room, socket);
//             assert(transmit.broadcastClients.calledOnce)
//             assert.deepStrictEqual(room, transmit.broadcastClients.getCall(0).args[0])
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

//     it("Should broadcast all data", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;
//         sandbox.spy(handlers);

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             assert(handlers.sendAllData.calledOnce)
//             assert.deepStrictEqual(room, handlers.sendAllData.getCall(0).args[0])
//             assert.deepStrictEqual(newClientInRoom, handlers.sendAllData.getCall(0).args[1])
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

//     it("Should remove the client from the room", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;

//         let socketClient1 = io.connect("http://localhost:3000", ioOptions);

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             assert.deepStrictEqual(room.clients[socket.id], newClientInRoom);
//             socketClient1.disconnect();
//             socket.on("disconnect", () => {
//                 handlers.clientDisconnect(room, newClientInRoom);
//                 assert.notDeepStrictEqual(room.clients[socket.id], newClientInRoom)
//                 done();
//             })
//         })
//     })

//     it("Should broadcast client control command", function () {
//         let room = new Room(socketIOServer);
//         let command = "reload"

//         handlers.AdminConnectionManagement(room, command);
//         assert(transmit.broadcastConnectionManagement.calledOnce);
//         assert.deepStrictEqual(transmit.broadcastConnectionManagement.getCall(0).args[0], room);
//         assert.strictEqual(transmit.broadcastConnectionManagement.getCall(0).args[1], command);
//     })

//     it("Should broadcast client control command", function () {
//         let room = new Room(socketIOServer);
//         let command = "discon"

//         handlers.AdminConnectionManagement(room, command);
//         assert(transmit.broadcastConnectionManagement.calledOnce);
//         assert.deepStrictEqual(transmit.broadcastConnectionManagement.getCall(0).args[0], room);
//         assert.strictEqual(transmit.broadcastConnectionManagement.getCall(0).args[1], command);
//     })

//     it("Should update the state of the client object", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             handlers.ReceiverPlayerReady(room, newClientInRoom);
//             assert.ok(!newClientInRoom.status.playerLoading);
//             assert.strictEqual(newClientInRoom.status.state, -1);
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

//     it("Should send the current video if it is playing", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             handlers.ReceiverPlayerReady(room, newClientInRoom);
//             assert(transmit.sendCurrentVideoIfPlaying.calledOnce);
//             assert.deepStrictEqual(transmit.sendCurrentVideoIfPlaying.getCall(0).args[0], room);
//             assert.deepStrictEqual(transmit.sendCurrentVideoIfPlaying.getCall(0).args[1], newClientInRoom);
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

//     it("Should pass current server video timestamp into callback", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;
//         room.currentVideo = new classes.ServerVideo("testID1", "testTitle1", "testChannel1", 1)
//         room.currentVideo.playVideo();
//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             handlers.ReceiverTimestampRequest(room, newClientInRoom, (timestamp) => {
//                 let roomVideoTS = room.currentVideo.getElapsedTime();

//                 assert.ok((roomVideoTS - 0.01 < timestamp && timestamp < roomVideoTS + 0.01));
//                 done();
//             });
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

//     it("Should set the timestamp of the server's current video", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;
//         let timestamp = 10;

//         room.io.on("connection", (socket) => {
//             handlers.ReceiverTimestampSyncRequest(room, timestamp);
//             assert.strictEqual(timestamp, room.currentVideo.getElapsedTime());
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

//     it("Should do nothing due to invalid id", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;
//         let videoDetails = {
//             id: "fakeID",
//             title: "fakeTitle",
//             channel: "fakeChannel",
//             duration: 10
//         }
//         room.currentVideo = new classes.ServerVideo("testID1", "testTitle1", "testChannel1", 1)

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             let result = handlers.ReceiverVideoDetails(room, newClientInRoom, videoDetails);
//             assert.strictEqual(result, 1);
//             assert.notStrictEqual(room.currentVideo.id, videoDetails.id);
//             assert.notStrictEqual(room.currentVideo.title, videoDetails.title);
//             assert.notStrictEqual(room.currentVideo.channel, videoDetails.channel);
//             assert.notStrictEqual(room.currentVideo.duration, videoDetails.duration);
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })
    
//     it("Should not broadcast now playing due to invalid id", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;
//         let videoDetails = {
//             id: "fakeID",
//             title: "fakeTitle",
//             channel: "fakeChannel",
//             duration: 10
//         }
//         room.currentVideo = new classes.ServerVideo("testID1", "testTitle1", "testChannel1", 1)

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             handlers.ReceiverVideoDetails(room, newClientInRoom, videoDetails);
//             assert(transmit.broadcastNowPlaying.notCalled);
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

//     it("Should set the details of the server video", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;
//         let videoDetails = {
//             id: "testID1",
//             title: "fakeTitle",
//             channel: "fakeChannel",
//             duration: 10
//         }
//         room.currentVideo = new classes.ServerVideo("testID1", "testTitle1", "testChannel1", 1)

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             handlers.ReceiverVideoDetails(room, newClientInRoom, videoDetails);
//             assert.strictEqual(room.currentVideo.id, videoDetails.id);
//             assert.strictEqual(room.currentVideo.title, videoDetails.title);
//             assert.strictEqual(room.currentVideo.channel, videoDetails.channel);
//             assert.ok((videoDetails.duration * 1000 - 0.01 < room.currentVideo.duration && room.currentVideo.duration < videoDetails.duration * 1000 + 0.01));
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

//     it("Should broadcast now playing", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;
//         let videoDetails = {
//             id: "testID1",
//             title: "fakeTitle",
//             channel: "fakeChannel",
//             duration: 10
//         }
//         room.currentVideo = new classes.ServerVideo("testID1", "testTitle1", "testChannel1", 1)

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             handlers.ReceiverVideoDetails(room, newClientInRoom, videoDetails);
//             assert(transmit.broadcastNowPlaying.calledOnce);
//             assert.deepStrictEqual(transmit.broadcastNowPlaying.getCall(0).args[0], room);
//             assert.deepStrictEqual(transmit.broadcastNowPlaying.getCall(0).args[1], room.currentVideo);
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

//     it("Should do nothing due to invalid id", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;
//         let data = {
//             videoID: "fakeID",
//         }
//         room.currentVideo = new classes.ServerVideo("testID1", "testTitle1", "testChannel1", 1)

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             let result = handlers.ReceiverPlayerStatus(room, newClientInRoom, data);
//             assert.strictEqual(result, 1);
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
//     })

    
//     it("Should set the new video in room", function (done) {
//         let room = new Room(socketIOServer);
//         let newClientInRoom;
//         let data = {
//             videoID: "fakeID",
//         }
//         room.currentVideo = new classes.ServerVideo("testID1", "testTitle1", "testChannel1", 1)

//         room.io.on("connection", (socket) => {
//             newClientInRoom = handlers.clientConnect(room, socket);
//             handlers.AdminNewVideo(room, "youtube.com/watch?v=testID2");
//             assert.strictEqual(result, 1);
//             done();
//         })

//         io.connect("http://localhost:3000", ioOptions);
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

// // describe("transmit.js tests", function () {
// //     var sender;
// //     var receiver;
// //     var client;
// //     var server;
// //     var expServer;
// //     var socketIOServer;

// //     beforeEach(function (done) {
// //         let expApp = express();
// //         socketIOServer = mock.start(() => {
// //             done();
// //         })
// //     })
// //     afterEach(function (done) {
// //         socketIOServer.close(() => {
// //             done()
// //         });
// //     })

// //     before(async () => {

// //     })

// //     after(async () => {

// //     })

// //     // Client array

// //     it("Should broadcast the client array", function (done) {
// //         var client1 = io.connect("http://localhost:3000", ioOptions);

// //         var room = testHelpers.roomWithTwoClients(socketIOServer);

// //         client1.once("serverClients", function (data) {
// //             assert.deepStrictEqual(data, room.clientsWithoutCircularReferences())
// //             done();
// //         })

// //         room.io.on("connection", (data) => {
// //             transmit.broadcastClients(room);
// //         })
// //     })

// //     it("Should broadcast the client array to all clients", function (done) {
// //         var client1 = io.connect("http://localhost:3000", ioOptions);
// //         var client2 = io.connect("http://localhost:3000", ioOptions);
// //         var clientCount = 0;
// //         var recievedCount = 0;

// //         var room = testHelpers.roomWithTwoClients(socketIOServer);
// //         // console.log(room.io)
// //         client1.once("serverClients", function (data) {
// //             assert.deepStrictEqual(data, room.clientsWithoutCircularReferences())
// //             recievedCount += 1;
// //             checkDone();
// //         })

// //         client2.once("serverClients", function (data) {
// //             assert.deepStrictEqual(data, room.clientsWithoutCircularReferences())
// //             recievedCount += 1;
// //             checkDone();
// //         })

// //         room.io.on("connection", (data) => {
// //             clientCount += 1;
// //             if (clientCount >= 2) {
// //                 transmit.broadcastClients(room);
// //             }
// //         })

// //         function checkDone() {
// //             if (recievedCount >= 2) {
// //                 done();
// //             }
// //         }
// //     })


// // });