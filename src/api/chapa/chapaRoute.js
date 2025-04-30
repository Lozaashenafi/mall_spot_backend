import express from "express";
import { initiateChapaPayment } from "./chapaController.js";

const router = express.Router();

router.get("/initialize", initiateChapaPayment);

export default router;
