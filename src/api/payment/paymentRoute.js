import express from "express";
import { getPayments, pay, paymentDetails } from "./paymentController.js";

const router = express.Router();
router.post("/pay", pay);
router.get("/:mallId/list", getPayments);
router.get("/:id", paymentDetails);

export default router;
