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
    const {
      id,
      visitDate,
      paymentDate,
      ownerName,
      ownerPhone,
      firstpayment,
      paymentDuration,
      note,
    } = req.body;
    const parsedId = parseInt(id, 10);

    // Check if parsedId is a valid number
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid ID provided" });
    }

    // Fetch the request and related post with the correct nested includes
    const request = await prismaClient.request.findUnique({
      where: { id: parsedId },
      include: {
        post: {
          include: {
            user: {
              include: {
                mall: true, // Including the mall related to the user
              },
            },
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Ensure mall is available before proceeding
    const mall = request.post.user.mall;
    if (!mall) {
      return res
        .status(400)
        .json({ message: "Mall information not available" });
    }

    // Update the selected request status to SELECTED
    await prismaClient.request.update({
      where: { id: parsedId },
      data: { status: "SELECTED" },
    });

    // Create an entry in the acceptedUser table
    const acceptedUser = await prismaClient.acceptedUser.create({
      data: {
        mallId: mall.id, // Use the mall from the user
        requestId: parsedId,
        userId: request.userId,
        postId: request.postId,
        visitDate: new Date(visitDate),
        note: note,
        paymentDateLimit: new Date(paymentDate),
        ownerName: ownerName,
        ownerPhone: ownerPhone,
        firstpayment: firstpayment,
        paymentDuration: paymentDuration,
      },
    });

    // Create a notification for the accepted request
    const acceptNotification = await prismaClient.notification.create({
      data: {
        userId: request.userId,
        message: `Your request for post "${request.post.title}" has been accepted! 🎉\nYou can visit the place on ${visitDate} and must pay the first fee by ${paymentDate}.`,
        type: "REQUEST",
      },
    });

    // Emit notification via Socket.IO
    io.to(`user_${request.userId}`).emit("notification", acceptNotification);

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
