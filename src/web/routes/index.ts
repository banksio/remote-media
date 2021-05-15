import { Router } from "express";
import { debug } from "../../rm/logging";
import pjson from "../../../package.json";

debug("remote-media version " + pjson.version);

const router = Router();

/* GET room receiver */
// router.get('/:room', function(req, res, next) {
router.get("/", (req, res, next) => {
    res.render("index", { appversion: pjson.version });
});

/* GET room admin */
// router.get('/:room/admin', function(req, res, next) {
router.get("/admin", (req, res, next) => {
    res.render("admin", { appversion: pjson.version });
});

export default router;
