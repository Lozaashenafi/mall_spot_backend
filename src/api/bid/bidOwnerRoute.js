import express from "express";
import { acceptBid, declineBid, getBids } from "./bidOwnerController.js";

const router = express.Router();

router.get("/:postId", getBids);
router.post("/accept", acceptBid);
router.post("/decline", declineBid);

export default router;
