import express from "express";
import { initiateChapaPayment } from "./chapaController.js";

const router = express.Router();

router.post("/initialize", initiateChapaPayment);

export default router;
