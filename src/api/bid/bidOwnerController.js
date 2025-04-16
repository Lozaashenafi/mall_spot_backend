import prisma from "../..//config/prismaClient.js";
import { io } from "../../../app.js";
export const getBids = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const bids = await prisma.bid.findMany({
      where: {
        postId: 2,
      },
      orderBy: {
        bidAmount: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        deposits: true, // ✅ Corrected from `deposit` to `deposits`
      },
    });

    res.status(200).json(bids);
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({
      error: "Failed to fetch bids",
      details: error.message,
    });
  }
};
export const acceptBid = async (req, res) => {
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
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid ID provided" });
    }

    // Fetch the bid and its related post and user
    const bid = await prisma.bid.findUnique({
      where: { id: parsedId },
      include: {
        post: {
          include: {
            user: {
              include: {
                mall: true,
              },
            },
          },
        },
      },
    });

    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    const mall = bid.post.user.mall;
    if (!mall) {
      return res
        .status(400)
        .json({ message: "Mall information not available" });
    }

    // Update bid status to WINNER
    await prisma.bid.update({
      where: { id: parsedId },
      data: { status: "WINNER" },
    });

    // Create entry in acceptedUser
    const acceptedUser = await prisma.acceptedUser.create({
      data: {
        mallId: mall.id,
        bidId: parsedId,
        userId: bid.userId, // fixed
        postId: bid.postId, // fixed
        visitDate: new Date(visitDate),
        note: note,
        paymentDateLimit: new Date(paymentDate),
        ownerName: ownerName,
        ownerPhone: ownerPhone,
        firstpayment: parseInt(firstpayment, 10),
        paymentDuration: parseInt(paymentDuration, 10),
      },
    });

    // Create notification
    const acceptNotification = await prisma.notification.create({
      data: {
        userId: bid.userId,
        message: `Your BID for post "${bid.post.title}" has been accepted! 🎉\nYou can visit the place on ${visitDate} and must pay the first fee by ${paymentDate}.`,
        type: "BID",
      },
    });

    // Emit notification
    io.to(`user_${bid.userId}`).emit("notification", acceptNotification); // fixed

    return res.status(200).json({ message: "Bid accepted successfully." });
  } catch (error) {
    console.error("Error accepting bid:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
export const declineBid = async (req, res) => {
  try {
    const { id } = req.body;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid ID provided" });
    }

    // Find the bid and include post and deposit info
    const bid = await prisma.bid.findUnique({
      where: { id: parsedId },
      include: {
        post: true,
        deposits: true, // Needed for refund
      },
    });

    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    // Update bid status to DECLINED
    await prisma.bid.update({
      where: { id: parsedId },
      data: { status: "DECLINED" },
    });

    // If deposits exist, create refund(s)
    if (bid.deposits && bid.deposits.length > 0) {
      for (const dep of bid.deposits) {
        await prisma.refund.upsert({
          where: { depositId: dep.id },
          update: { amount: dep.amount }, // update logic if needed
          create: {
            depositId: dep.id,
            amount: dep.amount,
          },
        });
      }
    }

    // Create notification for the declined bid
    const declineNotification = await prisma.notification.create({
      data: {
        userId: bid.userId, // fixed from request.userId
        message: `You lost the BID on the post "${bid.post.title}". Your deposit has been refunded.`,
        type: "BID",
        status: "UNREAD",
      },
    });

    // Emit real-time notification
    io.to(`user_${bid.userId}`).emit("notification", declineNotification); // fixed from request.userId

    return res
      .status(200)
      .json({ message: "Bid declined and refund processed." });
  } catch (error) {
    console.error("Error declining bid:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
