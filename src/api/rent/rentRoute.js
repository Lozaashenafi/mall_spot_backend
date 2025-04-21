import express from "express";
import {
  addRentInfo,
  assignRent,
  getRentId,
  getRentInfo,
  getRents,
  updateRentInfo,
  upload,
} from "./rentController.js";

const router = express.Router();
router.post("/add", assignRent);
router.post("/rentinfo", upload, addRentInfo);
router.put("/:rentId", upload, updateRentInfo);
router.get("/:mallId/list", getRents);
router.get("/:rentId", getRentInfo);
router.get("/user/:userId", getRentId);
export default router;
