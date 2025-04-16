import express from "express";
import { addBid } from "./bidController.js";

const router = express.Router();

// Register route
router.post("/add", addBid);

export default router;
