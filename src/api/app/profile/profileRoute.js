import express from "express";
import {
  changePassword,
  getProfile,
  updateProfile,
} from "./profileController.js";

const router = express.Router();

// Register route
router.get("/:id", getProfile);
router.put("/update/:id", updateProfile); // Assuming you have an updateProfile function in your controller
router.post("/:userId/change-password", changePassword);

export default router;
