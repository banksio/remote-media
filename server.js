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
var queue = [];
var playlistShuffle = true;

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
    io.emit("playlistInfoObj",queue);
    io.emit("playlistStatus", { "shuffle": playlistShuffle });

    socket.on("target",function(data){
        var inputData = data.value;
        if (data.pass == "koops"){
            var urlArray = inputData.split(',');
            console.log("LENGTH" + urlArray.length);
            if (urlArray.length == 1){
                var url = urlArray[0];
                // console.log(url)
                var videoID = getIDFromURL(url);
                console.log(videoID)
                if (videoID != undefined){
                    playVideo(videoID);
                }
                return;
            }
            for (var url of urlArray){
                var id = getIDFromURL(url);
                if (id != undefined){
                    queue.push({"id": id, "name": undefined});
                    consoleLogWithTime(id);
                }
            }
            io.emit("playlistInfoObj",queue);
            return;
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

    socket.on("serverQueueControl", function(data){
        switch (data) {
            case "prev":
                
                break;
            case "skip":
                playNextInQueue();
                break;
            case "empty":
                consoleLogWithTime("Emptying playlist");
                queue = [];
                io.emit("playlistInfoObj",queue);
                break;
            case "toggleShuffle":
                playlistShuffle = !playlistShuffle;
                consoleLogWithTime("Shuffle: " + playlistShuffle);
                io.emit("playlistStatus", { "shuffle": playlistShuffle });
                break;
            default:
                break;
        }
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
        if (data.state == 0 && queue.length > 0){
            playNextInQueue();
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
        consoleLogWithTime(data)
        consoleLogWithTime(logins);
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
        consoleLogWithTime("Connection management request recieved");
        if (control == "reload"){
            io.emit("site", "reload");
            consoleLogWithTime("Reloading all clients...");
        } else {
            io.emit("site", "discon");
            consoleLogWithTime("Disconnecting all clients...");
        }
    });
 
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
        var i = 1;
        for (var id of res["data"]["playlist"]){
            queue.push({"id": id, "name": undefined});
            i = i + 1;
            consoleLogWithTime(i);
        }
        io.emit("playlistInfoObj",queue);
    });
}

function playNextInQueue(){
    if (queue.length > 0){
        if (playlistShuffle){
            var nextIndex = Math.floor(Math.random() * queue.length);  // Random from the queue
            nextID = queue[nextIndex].id;  // Get next video ID
            queue.splice(nextIndex, 1);  // Remove from queue
        } else {
            nextID = queue.shift().id;
        }
        consoleLogWithTime("Playing another video from the queue.")
        playVideo(nextID);
    } else {
        consoleLogWithTime("There are no videos left in the queue to play.")
    }
    return;
}

function playVideo(ID){
    var newID = {"value": ID};
    consoleLogWithTime("New Video ID sent: "+newID.value);
    io.emit("target",newID);
    return;
}

function getIDFromURL(url){
    var id = undefined;

    const regex = /(?:\.be\/(.*?)(?:\?|$)|watch\?v=(.*?)(?:\&|$|\n))/ig;
    let m;

    while ((m = regex.exec(url)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
    
        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            if (groupIndex == 0){
                return "oof";
            }
            if (match == undefined){
                return "oof";
            }
            console.log(`Found match, group ${groupIndex}: ${match}`);
            id = match;
            
        });
    }
    // console.log(id);
    return id;
}