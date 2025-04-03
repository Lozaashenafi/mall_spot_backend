import express from "express";
import { addRequest, getRequests } from "./requestController.js";

const router = express.Router();

// Register route
router.post("/add", addRequest);
router.get("/:userId", getRequests);

export default router;
