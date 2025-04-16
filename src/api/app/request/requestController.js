import prisma from "../../../config/prismaClient.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { io } from "../../../../app.js";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/user_ids/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single("userIdUrl");

export const uploadImage = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: "File upload failed" });
    }
    res
      .status(200)
      .json({ imageUrl: `/uploads/user_ids/${req.file.filename}` });
  });
};

export const addRequest = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "File upload failed" });
    }

    try {
      const cleanBody = Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => [
          key.trim(),
          value.trim(),
        ])
      );

      const { userId, postId, userName, userPhone, note } = cleanBody;
      const userIdUrl = req.file
        ? `/uploads/user_ids/${req.file.filename}`
        : null;

      if (!userId || !postId || !userName || !userPhone || !userIdUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Get the post owner's userId
      const post = await prisma.post.findUnique({
        where: { id: parseInt(postId) },
        select: { userId: true }, // Get the userId of the post owner
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Create the request
      const request = await prisma.request.create({
        data: {
          userId: parseInt(userId),
          postId: parseInt(postId),
          userName,
          userPhone,
          userIdUrl,
          note,
        },
      });

      // Emit the notification to the post owner (who is the user associated with the post)
      io.to(`user-${post.userId}`).emit("newRequest", {
        id: request.id, // Use the ID of the created request
        message: `New request from user ${userName}.`, // Your notification message
        user: {
          userId: userId, // The user ID who made the request
          userName: userName, // The user's name
          userPhone: userPhone, // The user's phone number
        },
      });

      res.status(201).json({ message: "Request added successfully", request });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to add request", details: error.message });
    }
  });
};

export const getRequests = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from the request params

    const requests = await prisma.request.findMany({
      where: { userId: parseInt(userId) },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        post: {
          select: {
            id: true,
            title: true,
            images: {
              select: {
                id: true,
                imageURL: true,
              },
            },
          },
        },
      },
    });

    if (!requests || requests.length === 0) {
      return res
        .status(404)
        .json({ error: "No requests found for this user." });
    }

    // Return the requests
    res.status(200).json({ requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requestDetails = async (req, res) => {
  try {
    const { id } = req.params; // Get the request ID from the request parameters

    const acceptedRequestDetails = await prisma.acceptedRequest.findUnique({
      where: { requestId: parseInt(id) }, // Use dynamic ID from request parameters
      include: {
        post: true,
        mall: {
          include: {
            agreements: true, // Include agreements related to the mall
          },
        },
        request: true,
      },
    });

    if (!acceptedRequestDetails) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.status(200).json({ acceptedRequestDetails });
  } catch (error) {
    console.error("Error fetching request details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
