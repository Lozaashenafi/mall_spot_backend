import express from "express";
import {
  addPosts,
  getMyPosts,
  getPosts,
  postDetail,
  uploadPostImages,
} from "./postController.js";

const router = express.Router();

router.post("/add", uploadPostImages, addPosts);
router.get("/list/:id", postDetail);
router.get("/list", getPosts);
router.get("/mypost", getMyPosts);

export default router;
