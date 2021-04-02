import { Router } from "express";
import path from "path";
import routerRoot from "app-root-path";


const router = Router();

// Serve the receiver
router.get('/', function (req, res) {
    res.sendFile('../views/index.html');
});

// Serve the admin panel
router.get('/admin', function (req, res) {
    res.sendFile('../views/admin.html');
});

// Serve css
router.get('/stylesheets/fa.css', function (req, res) {
    res.sendFile(path.join(routerRoot.toString(), '/node_modules/@fortawesome/fontawesome-free/css/all.css'));
});

// Serve socket.io
router.get('/js/socket.io.js', function (req, res) {
    res.sendFile(path.join(routerRoot.toString(), '/node_modules/socket.io-client/dist/socket.io.js'));
});

// Serve socket.io
router.get('/js/socket.io.js.map', function (req, res) {
    res.sendFile(path.join(routerRoot.toString(), '/node_modules/socket.io-client/dist/socket.io.js.map'));
});

// Serve bootstrap and popper js
router.get('/js/bootstrap.bundle.min.js', function (req, res) {
    res.sendFile(path.join(routerRoot.toString(), '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'));
});

// Serve bootstrap and popper js
router.get('/js/bootstrap.bundle.min.js.map', function (req, res) {
    res.sendFile(path.join(routerRoot.toString(), '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js.map'));
});

// Serve jQuery
router.get('/js/jquery.slim.min.js', function (req, res) {
    res.sendFile(path.join(routerRoot.toString(), '/node_modules/jquery/dist/jquery.slim.min.js'));
});

// Serve jQuery
router.get('/js/jquery.slim.min.js.map', function (req, res) {
    res.sendFile(path.join(routerRoot.toString(), '/node_modules/jquery/dist/jquery.slim.min.js.map'));
});

export default router;