import express from "express";
import { getDashboardData } from "./dashboardController.js";

const router = express.Router();

router.get("/:mallId", getDashboardData);

export default router;
