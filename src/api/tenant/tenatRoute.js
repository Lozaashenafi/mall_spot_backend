import express from "express";
import { TenatRegister, listTenants, updateTenant } from "./tenatController.js";

const router = express.Router();
router.post("/register", TenatRegister);
router.get("/:mallId/list", listTenants);
router.put("/update/:tenantId", updateTenant);

export default router;
