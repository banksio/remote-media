//function to provide well formatted date for console messages
function consoleLogWithTime(msg){
    console.log("["+new Date().getHours()+":"+new Date().getMinutes()+":"+new Date().getSeconds()+"]"+msg);
}
consoleLogWithTime("[INFO] Starting server...");

//create blank logins array
var logins = [];

//function to search for client in logins array
function findClientByID(clientID) {
    var result;
    logins.forEach(function(obj){
        if (obj.id == clientID){
            result = obj;
        }
    })
    return logins.indexOf(result);
}
var targ = "-z6XVI-nCZs";

//include socket.io, express, and testing libraries
var socketio = require('socket.io');
var express = require('express');

consoleLogWithTime("[INFO] Starting express...");
//create express object
var exp = express();
//use it to serve pages from the web folder
exp.use(express.static('web'))
var web = exp.listen(process.env.PORT, process.env.IP, function() {
    consoleLogWithTime("[SUCCESS] Express started.")
})
 
//get socketio to listen to the webserver's connection
var io = socketio.listen(web, { log: false })
//Create a callback function to deal with each connection.
//The callback contains code to setup what happens whenever a named message is received
io.on('connection', function(socket) {
    //a new connection has been created i.e. a web browser has connected to the server
    logins.push({"id":socket.id,"username":null});
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
        if (data.pass == "koops"){
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
        io.emit("playerinfo",data);
        consoleLogWithTime("debug:PLAYER"+data)
    })
    
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
