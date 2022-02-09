import { json, Router, text } from "express";
import { debug } from "../../rm/logging";
import pjson from "../../../package.json";
import { handleVideoForcePush, receiverNickname } from "../../rm/handlers";

const router = Router();

interface putNicknameBody {
    name: string;
}

interface putVideoBody {
    videoID: string;
}

router.put("/nickname", json(), (req, res, next): void => {
    const clientID = req.query.client as string;

    if (!clientID) {
        res.status(400).send("No client specified");
        return;
    }

    receiverNickname("default", clientID, (req.body as putNicknameBody).name)
        .then(() => res.sendStatus(200))
        .catch(error => {
            if (error.message === "Duplicate Nickname Error") {
                res.sendStatus(409);
            } else {
                next(error);
            }
        });
});

router.put("/video", json(), (req, res, next): void => {
    const clientID = req.query.client as string;

    if (!clientID) {
        res.status(400).send("No client specified");
        return;
    }

    handleVideoForcePush("default", clientID, (req.body as putVideoBody).videoID)
        .then(() => res.sendStatus(200))
        .catch(error => {
            if (error.message === "No video ID found in URL.") {
                res.status(400).send(error.message);
            } else {
                next(error);
            }
        });
});

export default router;
