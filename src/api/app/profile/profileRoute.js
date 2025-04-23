import express from "express";
import { getProfile } from "./profileController";

const router = express.Router();

// Register route
router.post("/:id", getProfile);
export default router;
