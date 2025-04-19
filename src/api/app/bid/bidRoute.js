import express from "express";
import { addBid, getBids } from "./bidController.js";

const router = express.Router();

// Register route
router.post("/add", addBid);
router.get("/:userId", getBids);

export default router;
