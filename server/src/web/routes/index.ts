import routerRoot from "app-root-path";
import { Router } from "express";
import path from "path";
import pjson from "../../../package.json";
import { debug } from "../../rm/logging";

debug("remote-media version " + pjson.version);

const router = Router();

/* GET room receiver */
// router.get('/:room', function(req, res, next) {
router.get("/", (req, res, next) => {
    res.sendFile(path.join(routerRoot.toString(), "/build/index.html"));
});

/* GET room admin */
// router.get('/:room/admin', function(req, res, next) {
router.get("/admin", (req, res, next) => {
    res.render("admin", { appversion: pjson.version });
});

export default router;
