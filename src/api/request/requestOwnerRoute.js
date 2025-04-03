import express from "express";
import {
  acceptRequest,
  declineRequest,
  getRequests,
} from "./requestOwnerController.js";

const router = express.Router();

router.get("/:postId", getRequests);
router.post("/accept", acceptRequest);
router.post("/decline", declineRequest);

export default router;
