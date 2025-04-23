import express from "express";
import { addBid, getBids, bidDetails } from "./bidController.js";

const router = express.Router();

// Register route
router.post("/add", addBid);
router.get("/:userId", getBids);
router.get("/details/:bidId", bidDetails);

export default router;
