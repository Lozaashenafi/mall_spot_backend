import express from "express";
import {
  addPosts,
  getMyPosts,
  getPosts,
  postDetail,
  updatePost,
  uploadPostImages,
} from "./postController.js";

const router = express.Router();

router.post("/add", uploadPostImages, addPosts);
router.put("/update", uploadPostImages, updatePost);
router.get("/list/:id", postDetail);
router.get("/list", getPosts);
router.get("/mypost", getMyPosts);

export default router;
