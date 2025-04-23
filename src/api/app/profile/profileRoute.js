import express from "express";
import { changePassword, getProfile, updateProfile } from "./profileController";

const router = express.Router();

// Register route
router.get("/:id", getProfile);
router.put("/update/:id", updateProfile); // Assuming you have an updateProfile function in your controller
router.post("/:userId/changere-password", changePassword);

export default router;
