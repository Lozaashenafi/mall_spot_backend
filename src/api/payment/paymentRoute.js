import express from "express";
import {
  checkRentPayments,
  getFirstPayments,
  getPayments,
  getPaymentsByUserId,
  makeFirstPayment,
  pay,
  paymentDetails,
  nextPaymentDays,
  getPaymentInfoByUserId,
  getMallPayments,
} from "./paymentController.js";

const router = express.Router();
router.post("/pay", pay);
router.get("/user/:userId", getPaymentsByUserId);
router.get("/rent/:userId", checkRentPayments);
router.get("/:id", paymentDetails);
router.post("/firstpay", makeFirstPayment);
router.get("/getfirstpay/:mallId", getFirstPayments);
router.get("/getpayment/:mallId", getMallPayments);
router.get("/next/:userId", nextPaymentDays);
router.get("/info/:userId", getPaymentInfoByUserId);

export default router;
