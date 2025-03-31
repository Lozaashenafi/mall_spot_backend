import prisma from "../../config/prismaClient.js";

export const assignRent = async (req, res) => {
  try {
    const { tenantId, roomId, amount, paymentDuration } = req.body;

    if (!tenantId || !roomId || !amount || !paymentDuration) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Ensure the room is available
    const room = await prisma.rooms.findUnique({
      where: { id: parseInt(roomId) },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.status !== "AVAILABLE") {
      return res.status(400).json({ message: "Room is not available" });
    }

    // Assign Rent
    const rent = await prisma.rent.create({
      data: {
        userId: parseInt(tenantId),
        roomId: parseInt(roomId),
        amount: parseFloat(amount),
        PaymentDuration: parseInt(paymentDuration),
      },
    });

    // Update room status to "OCCUPIED"
    await prisma.rooms.update({
      where: { id: parseInt(roomId) },
      data: {
        status: "OCCUPIED",
      },
    });

    res
      .status(201)
      .json({ message: "Rent assigned and room marked as occupied", rent });
  } catch (error) {
    console.error("Error assigning rent:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRents = async (req, res) => {
  const { mallId } = req.params;

  try {
    const rents = await prisma.rent.findMany({
      where: {
        user: {
          mallId: parseInt(mallId), // Ensuring the user belongs to the specified mall
        },
      },
      include: {
        user: true,
        room: true,
      },
    });

    res.json(rents);
  } catch (error) {
    console.error("Error fetching rents:", error);
    res.status(500).json({ message: "Failed to fetch rents" });
  }
};
