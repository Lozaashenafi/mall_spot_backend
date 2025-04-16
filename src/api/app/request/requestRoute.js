import express from "express";
import {
  addRequest,
  getRequests,
  requestDetails,
} from "./requestController.js";

const router = express.Router();

// Register route
router.post("/add", addRequest);
router.get("/:userId", getRequests);
router.get("/accepted/:id", requestDetails);

export default router;
