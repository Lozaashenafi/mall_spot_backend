import express from "express";
import {
  addPosts,
  getPosts,
  postDetail,
  uploadPostImages,
} from "./postController.js";

const router = express.Router();

router.post("/add", uploadPostImages, addPosts);
router.get("/:id", postDetail);
router.get("/list", getPosts);

export default router;
