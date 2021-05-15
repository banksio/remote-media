const express = require("express")
(app = express()), (port = 3000), (io = require("socket.io"));

module.exports.start = cb => {
    const server = io.listen(app.listen(port, cb));

    return server;
};
// module.exports.stop = stop;
