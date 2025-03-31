import express from "express";
import { assignRent, getRents } from "./rentController.js";

const router = express.Router();
router.post("/add", assignRent);
router.get("/:mallId/list", getRents);

export default router;
