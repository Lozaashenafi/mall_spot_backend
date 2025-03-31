import express from "express";
import {
  createRoom,
  getCategory,
  getFloors,
  getRooms,
  updateRoom,
  deleteRoom,
  updateRoomPrice,
  getAvailableRooms,
} from "./roomController.js";

const router = express.Router();

router.post("/add", createRoom);
router.post("/price", updateRoomPrice);
router.get("/category", getCategory);
router.get("/floors", getFloors);
router.get("/list", getRooms);
router.get("/availablelist", getAvailableRooms);
router.put("/update/:id", updateRoom);
router.delete("/delete/:id", deleteRoom);

export default router;
