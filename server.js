//include socket.io, express, and testing libraries
const socketio = require('socket.io');
const express = require('express');
const ytlist = require('youtube-playlist');

const port = 3694;
const allEqual = arr => arr.every( v => v === arr[0] )

//create blank logins array
var logins = {};
var targ = "pE49WK-oNjU";
var anyPreloading = false;
var buffering = [];
var playlist = [];

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
    logins[socket.id] = {"username":null,"state":"Admin","preloading":false};
    consoleLogWithTime("New Client "+socket.id);
    //socket.emit("target",targ);
    io.emit("playerInfoObj",logins);

    socket.on("target",function(data){
        if (data.pass == "koops"){
            targ = data;
            consoleLogWithTime("New Video ID: "+data.value);
            io.emit("target",data);
        }
        
    });

    socket.on("targetAppend",function(data){
        consoleLogWithTime("recieved");
        // if (data.pass == "koops"){
        //     consoleLogWithTime("Queued Video ID: "+data.value);
        //     playlist.push({"id": data.value, "name": undefined});
        //     consoleLogWithTime(playlist);
        // }
        // io.emit("playlistInfoObj",playlist);
        addIDsFromPlaylist(data.value);
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
        if (anyPreloading == false && data.state == 3){  // Pause all if someone buffers
            buffering.push(socket.id);
            io.emit("playerControlRecv","pause");
            consoleLogWithTime("pausing cause buffer")
            consoleLogWithTime(data.state)
        } else if (data.state == 1) {
            if (buffering.length > 0){
                consoleLogWithTime("resuming")
                consoleLogWithTime(data.state)
                buffering.splice(buffering.indexOf(socket.id), 1);
                if (buffering.length == 0){
                    io.emit("playerControlRecv","play");
                }
            }
        }
        if (logins[socket.id].preloading == false){
            // if (data.state == 2) {
            //     io.emit("playerControlRecv","pause");
            // }
            // if (data.state == 1) {
            //     io.emit("playerControlRecv","play");
            // }
        }
        if (data.state == 0 && playlist.length > 0){
            newID = {"value": playlist.shift()["id"]}
            consoleLogWithTime("New Video ID: "+newID.value);
            io.emit("target",newID);
        }

        logins[socket.id].state = data.state;
        // consoleLogWithTime(logins[data.socketID].state);
        states = []
        for (var id in logins) {
            states.push(logins[id].state);
        }
        consoleLogWithTime(states);
        io.emit("playerInfoObj",logins);
    })

    socket.on("playerPreloading", function(data) {
        if (data){
            anyPreloading = true;
        }
        logins[socket.id].preloading = data;
        console.log(data)
        console.log(logins);
        if (allPreloaded(logins)){
            setTimeout(() => {
                anyPreloading = false;
            }, 1000);
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
        io.emit("playerInfoObj",logins);
    });
    
    socket.on("siteCon", function(control){
        console.log("oof");
        if (control == "reload"){
            io.emit("site", "reload");
            console.log("Reloading all clients...");
        } else {
            io.emit("site", "discon");
            console.log("Disconnecting all clients...");
        }
    })
 
})

function allPreloaded(clients){
    for(var client in clients){
        if(clients[client]["preloading"]) return false;
    }
    return true;
}

function addIDsFromPlaylist(playlistURL){
    consoleLogWithTime("Getting YouTube playlist video IDs");
    ytlist(playlistURL, 'id').then(res => {
        // => { data: { playlist: [ 'bgU7FeiWKzc', '3PUVr8jFMGg', '3pXVHRT-amw', 'KOVc5o5kURE' ] } }
        for (var id of res["data"]["playlist"]){
            playlist.push({"id": id, "name": undefined});
        }
        io.emit("playlistInfoObj",playlist);
    });
}