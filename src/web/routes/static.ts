import { Router } from "express";
import express from "express";
import path from "path";
import routerRoot from "app-root-path";

const router = Router();

router.use("/branding", express.static("./src/web/static/branding"));
router.use("/stylesheets", express.static("./src/web/static/stylesheets"));
router.use("/js", express.static("./build/src/web/static/js"));

// Serve css
router.get("/stylesheets/fa.css", (req, res) => {
    res.sendFile(path.join(routerRoot.toString(), "/node_modules/@fortawesome/fontawesome-free/css/all.css"));
});

// Serve socket.io
router.get("/js/socket.io.js", (req, res) => {
    res.sendFile(path.join(routerRoot.toString(), "/node_modules/socket.io-client/dist/socket.io.js"));
});

// Serve socket.io
router.get("/js/socket.io.js.map", (req, res) => {
    res.sendFile(path.join(routerRoot.toString(), "/node_modules/socket.io-client/dist/socket.io.js.map"));
});

// Serve bootstrap and popper js
router.get("/js/bootstrap.bundle.min.js", (req, res) => {
    res.sendFile(path.join(routerRoot.toString(), "/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"));
});

// Serve bootstrap and popper js
router.get("/js/bootstrap.bundle.min.js.map", (req, res) => {
    res.sendFile(path.join(routerRoot.toString(), "/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js.map"));
});

// Serve jQuery
router.get("/js/jquery.slim.min.js", (req, res) => {
    res.sendFile(path.join(routerRoot.toString(), "/node_modules/jquery/dist/jquery.slim.min.js"));
});

// Serve jQuery
router.get("/js/jquery.slim.min.js.map", (req, res) => {
    res.sendFile(path.join(routerRoot.toString(), "/node_modules/jquery/dist/jquery.slim.min.js.map"));
});

export default router;
