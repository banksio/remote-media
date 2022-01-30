import express from "express";
import staticRouter from "./web/routes/static";
import indexRouter from "./web/routes/index";
import roomRouter from "./web/routes/room";
import roomAPIRouter from "./web/routes/roomAPI";
import { info } from "./rm/logging";
import { startServer } from "./transport/transport-socket";
import { Room } from "./rm/room";
import { addRoom } from "./rm/roomManager";

// Constants
const port = 3694;

// Logging
info("Starting remote-media...");
info("Starting express...");

// Create express object and routers
const expApp = express();
expApp.use("/api", roomAPIRouter);
expApp.use("/", staticRouter);
// expApp.use('/room', roomRouter);

// Serve static web content
// expApp.use(express.static('./src/web/static'));

const web = expApp.listen(port);

const defaultRoom = addRoom("default");

export const transport = startServer(web);
