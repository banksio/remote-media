//include socket.io, express, and testing libraries
var socketio = require('socket.io');
var express = require('express');

const port = 3694;
const allEqual = arr => arr.every( v => v === arr[0] )

//create blank logins array
var logins = {};
var targ = "pE49WK-oNjU";

//function to provide well formatted date for console messages
function consoleLogWithTime(msg){
    console.log("["+new Date().getHours()+":"+new Date().getMinutes()+":"+new Date().getSeconds()+"]"+msg);
}
consoleLogWithTime("[INFO] Starting server...");

consoleLogWithTime("[INFO] Starting express...");
//create express object
var exp = express();
//use it to serve pages from the web folder
exp.use(express.static('web'))
var web = exp.listen(port)
 
//get socketio to listen to the webserver's connection
var io = socketio.listen(web, { log: false })
//Create a callback function to deal with each connection.
//The callback contains code to setup what happens whenever a named message is received
io.on('connection', function(socket) {
    //a new connection has been created i.e. a web browser has connected to the server
    logins[socket.id] = {"username":null,"state":-2,"preloading":false};
    consoleLogWithTime("New Client "+socket.id);
    //socket.emit("target",targ);

    socket.on("target",function(data){
        if (data.pass == "koops"){
            targ = data;
            consoleLogWithTime("New Video ID: "+data.value);
            io.emit("target",data);
        }
        
    });
    
    socket.on("speak", function(data) {
        if (true){
            io.emit("speechRecv",data.value);
            consoleLogWithTime("Text to Speech: "+data.value)
        }
    })

    socket.on("playerControl", function(data){
        io.emit("playerControlRecv",data);
        consoleLogWithTime("Video Control: "+data)
    })
    
    socket.on("volumeSend", function(data){
        io.emit("volumeRecv",data);
        consoleLogWithTime("Volume: "+data)
    })
    
    socket.on("playerinfo", function(data) {
        // io.emit("playerinfo",data);
        if (socket.id == undefined){
            return;
        }
        consoleLogWithTime("debug:PLAYER"+socket.id + " status: " + data.state)
        // if (logins[socket.id].preloading == false && (data.state == 3 || data.state == -1)){  // Pause all if someone buffers
        //     io.emit("playerControlRecv","pause");
        //     consoleLogWithTime("pausing cause buffer")
        // }
        if (logins[socket.id].preloading == false){
            // if (data.state == 2) {
            //     io.emit("playerControlRecv","pause");
            // }
            // if (data.state == 1) {
            //     io.emit("playerControlRecv","play");
            // }
        }

        logins[socket.id].state = data.state;
        // consoleLogWithTime(logins[data.socketID].state);
        states = []
        for (var id in logins) {
            states.push(logins[id].state);
        }
        consoleLogWithTime(states);
    })

    socket.on("playerPreloading", function(data) {
        logins[socket.id].preloading = data;
        console.log(logins);
        if (allPreloaded(logins)){
            io.emit("playerControlRecv","play");
        }
    });

    // socket.on("playerBuffered", function(data) {
    //     if (data.socketID == undefined){
    //         return;
    //     }
    //     // io.emit("playerBuffered",data);
    //     consoleLogWithTime("debug:PLAYER "+data.socketID + " buffered: " + data.buffered)
    //     // if (data.state == 3){  // Pause all if someone buffers
    //     //     io.emit("playerControlRecv","pause");
    //     //     consoleLogWithTime("pausing cause buffer")
    //     // }
    //     // logins[data.socketID].state = data.state;
    //     // consoleLogWithTime(logins[data.socketID].state);
    //     // states = []
    //     // for (var id in logins) {
    //     //     states.push(logins[id].state);
    //     // }
    //     // consoleLogWithTime(states);
    //     // if (!states.includes(3)){
    //     //     consoleLogWithTime("playing");
    //     //     io.emit("playerControlRecv","play");
    //     // }
    // })

    socket.on('disconnect', () => {
        io.emit('user disconnected');
        delete logins[socket.id];
    });
    
    // socket.on("site", function(control){
    //     if (control == "reload"){
    //         io.emit("reload");
    //         console.log("Reloading all clients...");
    //     } else {
    //         io.emit("exit");
    //         console.log("Disconnecting all clients...");
    //     }
    // })
 
})

function allPreloaded(clients){
    for(var client in clients){
        if(clients[client]["preloading"]) return false;
    }
    return true;
}