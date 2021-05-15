import { Router } from "express";
import { debug } from "../../rm/logging";
import pjson from "../../../package.json";

const router = Router();

/* GET room receiver */
router.get("/:room", (req, res, next) => {
    res.render("index", { appversion: pjson.version });
});

/* GET room admin */
router.get("/:room/admin", (req, res, next) => {
    res.render("admin", { appversion: pjson.version });
});

export default router;
