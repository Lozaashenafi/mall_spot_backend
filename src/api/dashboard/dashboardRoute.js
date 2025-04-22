import express from "express";
import { getDashboardData } from "./dashboardController";

const router = express.Router();

router.get("/:mallId", getDashboardData);

export default router;
