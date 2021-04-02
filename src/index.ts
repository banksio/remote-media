import express from 'express';
import staticRouter from './web/routes/static'
import indexRouter from './web/routes/index'
import { info } from './rm/logging';
import { startServer } from './rm/server';

// Constants 
const port = 3694;

info("Starting remote-media...");
info("Starting express...");

// Create express object
const expApp = express();
expApp.set('view engine', 'ejs')
expApp.set('views', './src/web/views');
expApp.use(indexRouter);
expApp.use('/static', staticRouter);


//use it to serve pages from the web folder
expApp.use(express.static('./src/web/static'));

const web = expApp.listen(port);

startServer(web);