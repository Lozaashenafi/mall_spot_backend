import prisma from "../../config/prismaClient.js";

export const addSubscription = async (req, res) => {
  const { mallId, price, endDate, startDate } = req.body; // Extract data from request body

  try {
    // Create a new subscription in the database
    const subscription = await prisma.subscription.create({
      data: {
        mallId,
        price,
        endDate,
        startDate,
      },
    });

    res.status(201).json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Failed to create subscription." });
  }
};

export const getSubscription = async (req, res) => {
  const { mallId } = req.params;
  try {
    // Fetch the subscription for the given mallId
    const subscription = await prisma.subscription.findUnique({
      where: { mallId },
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found." });
    }

    res.status(200).json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ message: "Failed to fetch subscription." });
  }
};

export const getAllSubscriptions = async (req, res) => {
  try {
    // Fetch all subscriptions from the database
    const subscriptions = await prisma.subscription.findMany({
      include: {
        mall: true, // Include related mall data
      },
    });

    res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions." });
  }
};
