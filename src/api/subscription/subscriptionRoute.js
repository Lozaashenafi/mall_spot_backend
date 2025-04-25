import express from "express";
import {
  addSubscription,
  getAllSubscriptions,
  getSubscription,
} from "./subscriptionController.js";

const router = express.Router();

router.post("/add", addSubscription);
router.get("/get/:mallId", getSubscription);
router.get("/getAll", getAllSubscriptions);
export default router;
