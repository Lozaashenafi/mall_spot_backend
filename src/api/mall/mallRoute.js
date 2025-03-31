import express from "express";
import {
  registerMall,
  uploadMallImagesMiddleware,
  getMalls,
  getMallById,
  updateMall,
  OwnerRegister,
  getMallOwners,
  uploadAgreement,
  mallInfo,
  getMallDetail,
  addPricePerCare,
  listPricePerCare,
} from "./mallController.js";
import { isAdmin } from "../../middleware/auth.js";

const router = express.Router();
router.post("/register", isAdmin, uploadMallImagesMiddleware, registerMall);
router.post("/owner/register", isAdmin, OwnerRegister);
router.post("/save-mall-info", uploadAgreement, mallInfo);
router.get("/malls", getMalls);
router.get("/owners", getMallOwners);
router.get("/:id", getMallById);
router.get("/detail/:id", getMallDetail);
router.put("/update/:id", isAdmin, uploadMallImagesMiddleware, updateMall);
router.post("/pricePerCare/add", addPricePerCare);
router.get("/pricePerCare/list", listPricePerCare);

export default router;
