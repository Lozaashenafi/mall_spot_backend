import express from "express";
import {
  getAdminDashbordData,
  getDashboardData,
} from "./dashboardController.js";

const router = express.Router();

router.get("/owner/:mallId", getDashboardData);
router.get("/admin", getAdminDashbordData);

export default router;
