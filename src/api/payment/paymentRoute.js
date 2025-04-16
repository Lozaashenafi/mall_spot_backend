import express from "express";
import {
  checkRentPayments,
  getFirstPayments,
  getPayments,
  getPaymentsByUserId,
  makeFirstPayment,
  pay,
  paymentDetails,
} from "./paymentController.js";

const router = express.Router();
router.post("/pay", pay);
router.get("/:mallId/list", getPayments);
router.get("/:userId", getPaymentsByUserId);
router.get("/rent/:userId", checkRentPayments);
router.get("/:id", paymentDetails);
router.post("/firstpay", makeFirstPayment);
router.get("/getfirstpay/:mallId", getFirstPayments);

export default router;
