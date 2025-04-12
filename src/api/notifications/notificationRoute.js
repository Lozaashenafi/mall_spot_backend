import express from "express";
import { getNotification } from "./notificationController.js";

const router = express.Router();
router.get("/:userId", getNotification);

export default router;
