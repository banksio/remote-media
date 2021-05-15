const express = require("express")
(app = express()),
    (port = 3000),
    // , http = require('http').Server(app)
    (io = require("socket.io"));

// io.on('connection', function(socket){
//     socket.on('message', function(msg){
//         io.sockets.emit('message', msg)
//     })
// })

// var web =

// let server = http.listen(port, () => {
//     console.log('App listening on port %s, in environment %s!', port, _.toUpper(process.env.NODE_ENV || ''));
// });

// function stop() {
//     server.close();
// }

module.exports.start = cb => {
    const server = io.listen(app.listen(port, cb));
    return server;
};
// module.exports.stop = stop;
