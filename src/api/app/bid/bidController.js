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

// Endpoint to upload image only (optional)
export const uploadImage = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: "File upload failed" });
    }
    res.status(200).json({
      imageUrl: `/uploads/user_ids/${req.file.filename}`,
    });
  });
};
export const addBid = async (req, res) => {
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

      const { userId, postId, userName, userPhone, note, bidAmount } =
        cleanBody;

      const userIdUrl = req.file
        ? `/uploads/user_ids/${req.file.filename}`
        : null;

      if (
        !userId ||
        !postId ||
        !userName ||
        !userPhone ||
        !userIdUrl ||
        !bidAmount
      ) {
        return res
          .status(400)
          .json({ error: "All fields are required, including bidAmount" });
      }

      const post = await prisma.post.findUnique({
        where: { id: parseInt(postId) },
        select: { userId: true, bidDeposit: true },
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (!post.bidDeposit) {
        return res
          .status(400)
          .json({ error: "Post does not have a deposit amount" });
      }

      const existingBid = await prisma.bid.findFirst({
        where: {
          userId: parseInt(userId),
          postId: parseInt(postId),
        },
      });

      if (existingBid) {
        return res
          .status(400)
          .json({ error: "You have already placed a bid on this post" });
      }

      // Create deposit record first
      const deposit = await prisma.deposit.create({
        data: {
          userId: parseInt(userId),
          amount: post.bidDeposit,
        },
      });

      // Now create the bid with the depositId
      const bid = await prisma.bid.create({
        data: {
          userId: parseInt(userId),
          postId: parseInt(postId),
          userName,
          userPhone,
          userIdUrl,
          bidAmount: parseFloat(bidAmount),
          note,
          depositId: deposit.id,
        },
      });

      // Emit real-time notification
      io.to(`user-${post.userId}`).emit("newBid", {
        id: bid.id,
        message: `New bid from ${userName}.`,
        user: {
          userId,
          userName,
          userPhone,
        },
      });

      res.status(201).json({
        message: "Bid and deposit recorded successfully",
        bid,
      });
    } catch (error) {
      console.error("Error placing bid:", error);
      res.status(500).json({
        error: "Failed to place bid",
        details: error.message,
      });
    }
  });
};
export const getBids = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const bids = await prisma.bid.findMany({
      where: { userId: parseInt(userId) },
      include: {
        deposit: true,
        post: true, // Optional: include post info related to the bid
      },
    });

    res.status(200).json(bids);
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({ error: "Failed to fetch bids" });
  }
};
export const bidDetails = async (req, res) => {
  try {
    const { bidId } = req.params;

    const acceptedUserDetails = await prisma.acceptedUser.findFirst({
      where: { bidId: parseInt(bidId) },
      include: {
        post: true,
        mall: {
          include: {
            agreements: true,
          },
        },
        bid: true,
      },
    });

    if (!acceptedUserDetails) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.status(200).json({ acceptedUserDetails });
  } catch (error) {
    console.error("Error fetching request details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
