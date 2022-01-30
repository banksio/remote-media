import { Router } from "express";
import express from "express";
import path from "path";
import routerRoot from "app-root-path";

const router = Router();

router.use("/", express.static(path.join(routerRoot.toString(), "/dist")));

export default router;
