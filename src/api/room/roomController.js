// roomController.js
import prisma from "../../config/prismaClient.js";

export const createRoom = async (req, res) => {
  try {
    const {
      floorId,
      categoryId,
      roomNumber,
      care,
      hasWindow,
      hasBalcony,
      hasAttachedBathroom,
      hasParkingSpace,
      pricePerCare, // This is a boolean flag
    } = req.body;

    console.log("Received room data:", req.body);

    if (!floorId || !roomNumber || care === undefined) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Fetch the floor along with its associated mall
    const floor = await prisma.floor.findUnique({
      where: { id: Number(floorId) },
      include: { mall: true },
    });

    if (!floor || !floor.mall) {
      return res
        .status(400)
        .json({ message: "Invalid floor or mall not found." });
    }
    // Check if the room number already exists in this mall
    const existingRoom = await prisma.rooms.findFirst({
      where: {
        roomNumber: roomNumber,
        floor: {
          mallId: floor.mall.id, // Ensure it is inside the same mall
        },
      },
      include: {
        floor: true, // Ensure the relationship is checked
      },
    });

    if (existingRoom) {
      console.log("Room already exists:", existingRoom);
      // You could update the existing room here, or return an appropriate message
      return res.status(400).json({
        message: "Room with this number already exists in the mall.",
        existingRoom: existingRoom,
      });
    }

    // Fetch the latest pricePerCare value from the PricePerCare table for the mall

    const pricePerCareEntry = await prisma.pricePerCare.findFirst({
      where: {
        mallId: floor.mall.id, // Ensure it matches the correct mall
        OR: [
          { floor: floor.id }, // Exact floor match
          { floor: null }, // If no exact match, take the one with NULL
        ],
      },
      orderBy: { createdAt: "desc" }, // Get the latest entry
    });

    let price = null;

    // Calculate price only if pricePerCare flag is true and there's a valid pricePerCare value
    if (pricePerCare && pricePerCareEntry) {
      price = parseFloat(care) * parseFloat(pricePerCareEntry.price);
    }

    console.log("Calculated price:", price); // Debugging

    // Create the new room
    const newRoom = await prisma.rooms.create({
      data: {
        floorId: Number(floorId),
        categoryId: categoryId ? Number(categoryId) : null,
        roomNumber,
        care: parseFloat(care),
        hasWindow,
        hasBalcony,
        hasAttachedBathroom,
        hasParkingSpace,
        pricePerCare,
        price, // Save the calculated price (or null if pricePerCare is false)
      },
    });

    console.log("New Room Created:", newRoom);
    return res.status(201).json(newRoom);
  } catch (error) {
    console.error("Error creating room:", error);
    return res
      .status(500)
      .json({ message: "Error creating room.", error: error.message });
  }
};

// Get Categories
export const getCategory = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error });
  }
};

export const getFloors = async (req, res) => {
  try {
    const { mallId } = req.query;
    if (!mallId) {
      return res.status(400).json({ message: "Mall ID is required" });
    }

    const floors = await prisma.floor.findMany({
      where: { mallId: parseInt(mallId) },
    });

    res.json(floors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching floors", error });
  }
};

export const getRooms = async (req, res) => {
  const { mallId } = req.query; // Get mallId from request query

  if (!mallId) {
    return res.status(400).json({ message: "Mall ID is required." });
  }

  try {
    const rooms = await prisma.rooms.findMany({
      where: {
        floor: {
          mallId: parseInt(mallId), // Filter by mallId
        },
      },
      include: {
        floor: {
          select: { description: true }, // Include floor description
        },
      },
    });

    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Failed to fetch rooms." });
  }
};
export const getAvailableRooms = async (req, res) => {
  const { mallId } = req.query; // Get mallId from request query

  if (!mallId) {
    return res.status(400).json({ message: "Mall ID is required." });
  }

  try {
    const rooms = await prisma.rooms.findMany({
      where: {
        floor: {
          mallId: parseInt(mallId), // Filter by mallId
        },
        status: "AVAILABLE", // Ensure only available rooms are fetched
      },
      include: {
        floor: {
          select: { description: true }, // Include floor description
        },
      },
    });

    res.json(rooms);
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    res.status(500).json({ message: "Failed to fetch available rooms." });
  }
};

export const updateRoom = async (req, res) => {
  const { id } = req.params;
  const { roomNumber, care } = req.body;
  console.log("Received room data:", req.body);

  try {
    // Check if the room exists and is available
    const room = await prisma.rooms.findUnique({
      where: { id: parseInt(id) },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    if (room.status !== "AVAILABLE") {
      return res
        .status(400)
        .json({ message: "Only available rooms can be updated." });
    }

    // Check if the new roomNumber already exists
    const existingRoom = await prisma.rooms.findFirst({
      where: {
        roomNumber: roomNumber.toString(), // Ensure roomNumber is a string
        NOT: { id: parseInt(id) },
      },
    });

    if (existingRoom) {
      return res.status(400).json({ message: "Room number already exists." });
    }

    // Ensure care is a valid float
    const careFloat = parseFloat(care);
    if (isNaN(careFloat)) {
      return res
        .status(400)
        .json({ message: "Invalid care value. Must be a float." });
    }

    // Update room
    const updatedRoom = await prisma.rooms.update({
      where: { id: parseInt(id) },
      data: {
        roomNumber: roomNumber.toString(), // Ensure roomNumber is a string
        care: careFloat, // Ensure care is a float
      },
    });

    res.json({ message: "Room updated successfully.", room: updatedRoom });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ message: "Failed to update room." });
  }
};

export const deleteRoom = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the room exists and is available
    const room = await prisma.rooms.findUnique({
      where: { id: parseInt(id) },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    if (room.status !== "AVAILABLE") {
      return res
        .status(400)
        .json({ message: "Only available rooms can be deleted." });
    }

    // Delete the room
    await prisma.rooms.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Room deleted successfully." });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Failed to delete room." });
  }
};

export const updateRoomPrice = async (req, res) => {
  const { roomId, price } = req.body;

  // Validate input
  if (!roomId || price === undefined) {
    return res.status(400).json({ message: "Room ID and price are required." });
  }

  try {
    const updatedRoom = await prisma.rooms.update({
      where: { id: parseInt(roomId, 10) },
      data: { price: parseFloat(price) },
    });

    return res.status(200).json({
      success: true,
      message: "Room price updated successfully.",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Error updating room price:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
