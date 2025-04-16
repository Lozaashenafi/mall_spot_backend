import express from "express";
import {
  addRentInfo,
  assignRent,
  getRentInfo,
  getRents,
  updateRentInfo,
} from "./rentController.js";

const router = express.Router();
router.post("/add", assignRent);
router.post("/rentinfo", addRentInfo);
router.get("/:mallId/list", getRents);
router.put("/:rentId", updateRentInfo);
router.get("/:rentId", getRentInfo);

export default router;
