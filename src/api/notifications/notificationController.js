import prisma from "../../config/prismaClient.js";
export const getNotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { userId: parseInt(userId) },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!notifications) {
      return res.status(404).json({ error: "No notifications found" });
    }

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
