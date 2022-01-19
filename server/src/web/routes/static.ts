import { Router } from "express";
import express from "express";
import path from "path";
import routerRoot from "app-root-path";

const router = Router();

// TODO: Change this path
router.use("/", express.static("./build/dist"));

export default router;
