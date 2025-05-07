import prisma from "../../config/prismaClient.js";
import postSchema from "./postSchema.js";
import multer from "multer";
import path from "path";

// Multer configuration (Stores images in 'uploads/post/' folder)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/post/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export const addPosts = async (req, res) => {
  try {
    // Validate request body
    const { error } = postSchema.addPost.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const {
      mallId,
      roomId,
      title,
      description,
      price,
      bidDeposit,
      bidEndDate,
      userId,
      status,
    } = req.body;

    // Check if the room exists and is AVAILABLE
    const room = await prisma.rooms.findUnique({
      where: { id: Number(roomId) },
    });

    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.status !== "AVAILABLE")
      return res.status(400).json({ error: "Room is not available" });

    // Create the post
    const newPost = await prisma.post.create({
      data: {
        mallId: Number(mallId),
        roomId: Number(roomId),
        title,
        description,
        price: price ? parseFloat(price) : null,
        bidDeposit: bidDeposit ? parseFloat(bidDeposit) : null,
        bidEndDate: bidEndDate ? new Date(bidEndDate) : null,
        userId: Number(userId),
        status: status || "APPROVED",
      },
    });

    // Save image URLs to the database (if images exist)
    if (req.files && req.files.length > 0) {
      const imageRecords = req.files.map((file) => ({
        postId: newPost.id,
        imageURL: `/uploads/post/${file.filename}`, // Change this if using cloud storage
      }));

      await prisma.postImage.createMany({ data: imageRecords });
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create post" });
  }
};
export const updatePost = async (req, res) => {
  try {
    const { postId, title, description, price, bidDeposit, bidEndDate } =
      req.body;

    if (!postId) {
      return res.status(400).json({ error: "postId is required for update" });
    }

    // Check if the post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: Number(postId) },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Update only the allowed fields
    const updatedPost = await prisma.post.update({
      where: { id: Number(postId) },
      data: {
        title,
        description,
        price: price ? parseFloat(price) : null,
        bidDeposit: bidDeposit ? parseFloat(bidDeposit) : null,
        bidEndDate: bidEndDate ? new Date(bidEndDate) : null,
      },
    });

    // Handle exactly 3 image uploads
    let newImages = [];

    if (req.files && req.files.length === 3) {
      // Delete old images if new images are uploaded
      await prisma.postImage.deleteMany({
        where: { postId: updatedPost.id },
      });

      // Insert new images
      newImages = req.files.map((file) => ({
        postId: updatedPost.id,
        imageURL: `/uploads/post/${file.filename}`, // Change this if using cloud storage
      }));
    } else if (req.files && req.files.length !== 3) {
      return res.status(400).json({ error: "Exactly 3 images are required." });
    }

    // If no new images, keep the old ones
    if (newImages.length === 0) {
      newImages = existingPost.images.map((img) => ({
        postId: updatedPost.id,
        imageURL: img.imageURL, // Keep existing images
      }));
    }

    // Save image URLs to the database
    if (newImages.length > 0) {
      await prisma.postImage.createMany({ data: newImages });
    }

    res
      .status(200)
      .json({ post: updatedPost, message: "Post updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update post" });
  }
};

// Middleware for handling file uploads
export const uploadPostImages = upload.array("images", 3); // Max 3 images

export const getPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        mall: {
          include: {
            agreements: true,
            mallImage: true,
          },
        }, // This will fetch the associated mall for the post
        room: {
          include: {
            category: true, // Fetch the category associated with the room
          },
        }, // Fetch room information for the post
        bids: true, // Fetch bids associated with the post
        images: {
          // Fetch images associated with the post
          select: {
            imageURL: true, // Adjust based on your field name in the PostImage model
          },
        },
      },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};
export const getMyPosts = async (req, res) => {
  try {
    const { userId } = req.query; // Extract userId from query parameters

    // Log userId to check its value
    console.log("Received userId:", userId);

    // Ensure userId is present and a valid number
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "Invalid or missing userId" });
    }

    // Convert userId to a number
    const numericUserId = Number(userId);

    const posts = await prisma.post.findMany({
      where: { userId: numericUserId },
      include: {
        user: true,
        mall: true,
        room: true,
        bids: true,
        images: { select: { imageURL: true } },
      },
    });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
};
export const postDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        mall: {
          include: {
            agreements: true,
            mallImage: true,
          },
        },
        room: {
          include: {
            category: true, // This should be nested inside room.include
          },
        },
        bids: true,
        images: {
          select: {
            imageURL: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};
