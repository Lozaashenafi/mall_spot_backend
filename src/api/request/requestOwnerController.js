import prismaClient from "../..//config/prismaClient.js";

import { io } from "../../../app.js";

export const getRequests = async (req, res) => {
  const { postId } = req.params;

  // Validate postId
  if (isNaN(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  try {
    const requests = await prismaClient.request.findMany({
      where: {
        postId: parseInt(postId),
      },
      include: {
        post: true,
        user: true,
      },
    });

    if (requests.length === 0) {
      return res
        .status(404)
        .json({ message: "No requests found for this post" });
    }

    res.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error); // Log the full error
    res.status(500).json({
      error: "An error occurred while fetching requests",
      details: error.message,
    });
  }
};
export const acceptRequest = async (req, res) => {
  try {
    const { id } = req.body;
    const parsedId = parseInt(id, 10);

    // Check if parsedId is a valid number
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid ID provided" });
    }

    const { visitDate, paymentDate, ownerName, ownerPhone } = req.body;

    // Fetch the request and related post
    const request = await prismaClient.request.findUnique({
      where: { id: parsedId },
      include: { post: { include: { user: true } } }, // Include post owner details
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update the selected request status to SELECTED
    await prismaClient.request.update({
      where: { id: parsedId },
      data: { status: "SELECTED" },
    });

    // Update all other requests for the same post to DECLINED
    await prismaClient.request.updateMany({
      where: {
        postId: request.postId,
        id: { not: parsedId },
      },
      data: { status: "DECLINED" },
    });

    // Create notification for accepted request
    const acceptNotification = await prismaClient.notification.create({
      data: {
        userId: request.userId,
        message: `Your request for post "${request.post.title}" has been accepted! 🎉\nYou can visit the place on ${visitDate} and must pay the first fee by ${paymentDate}.\nContact the owner: ${ownerName}, 📞 ${ownerPhone}`,
        type: "REQUEST",
        status: "UNREAD",
      },
    });

    // Emit notification via Socket.IO
    io.to(`user_${request.userId}`).emit("notification", acceptNotification);

    // Get declined requests
    const declinedRequests = await prismaClient.request.findMany({
      where: {
        postId: request.postId,
        id: { not: parsedId },
      },
    });

    // Create notifications for declined requests
    const declineNotifications = declinedRequests.map((declined) => ({
      userId: declined.userId,
      message: `Your request for post "${request.post.title}" has been declined. ❌`,
      type: "REQUEST",
      status: "UNREAD",
    }));

    // Save notifications in DB
    await prismaClient.notification.createMany({ data: declineNotifications });

    // Emit notifications for declined users
    declinedRequests.forEach((declined) => {
      io.to(`user_${declined.userId}`).emit("notification", {
        userId: declined.userId,
        message: `Your request for post "${request.post.title}" has been declined. ❌`,
        type: "REQUEST",
        status: "UNREAD",
      });
    });

    return res.status(200).json({ message: "Request accepted successfully." });
  } catch (error) {
    console.error("Error accepting request:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
export const declineRequest = async (req, res) => {
  try {
    const { id } = req.body;
    const parsedId = parseInt(id, 10);

    // Check if parsedId is a valid number
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid ID provided" });
    }

    // Find the request and include the post details
    const request = await prismaClient.request.findUnique({
      where: { id: parsedId },
      include: { post: true }, // Include post details, like title
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request status to DECLINED
    await prismaClient.request.update({
      where: { id: parsedId },
      data: { status: "DECLINED" },
    });

    // Create notification for the declined request
    const declineNotification = await prismaClient.notification.create({
      data: {
        userId: request.userId,
        message: `Your request for the post "${request.post.title}" has been declined. ❌`, // Use post title
        type: "REQUEST",
        status: "UNREAD",
      },
    });

    // Emit real-time notification via Socket.IO
    io.to(`user_${request.userId}`).emit("notification", declineNotification);

    return res.status(200).json({ message: "Request declined successfully." });
  } catch (error) {
    console.error("Error declining request:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
