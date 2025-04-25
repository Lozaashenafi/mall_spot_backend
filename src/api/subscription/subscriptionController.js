import prisma from "../../config/prismaClient.js";

// Add Subscription
export const addSubscription = async (req, res) => {
  const { mallId, price, endDate, startDate } = req.body;

  try {
    const subscription = await prisma.subscription.create({
      data: {
        mallId,
        price,
        endDate,
        startDate,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Subscription created successfully.",
      data: subscription,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create subscription.",
    });
  }
};

export const getSubscription = async (req, res) => {
  const { mallId } = req.params;

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { mallId: Number(mallId) },
    });

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No subscriptions found for this mall.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Subscriptions fetched successfully.",
      data: subscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch subscriptions.",
    });
  }
};

// Get All Subscriptions
export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        mall: true,
      },
    });

    res.status(200).json({
      status: "success",
      message: "All subscriptions fetched successfully.",
      data: subscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch subscriptions.",
    });
  }
};
