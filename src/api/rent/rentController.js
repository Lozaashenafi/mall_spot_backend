import prisma from "../../config/prismaClient.js";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/banner/";
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
    res.status(200).json({ imageUrl: `/uploads/banner/${req.file.filename}` });
  });
};
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
export const addRentInfo = async (req, res) => {
  const { rentId, businessName, discription, workingOn } = req.body;
  const file = req.file; // This will be undefined if no file is uploaded

  try {
    const existing = await prisma.rentInfo.findUnique({
      where: { rentId: parseInt(rentId) },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "RentInfo already exists for this rentId" });
    }

    const bannerUrl = file ? `/uploads/banner/${file.filename}` : null;

    const rentInfo = await prisma.rentInfo.create({
      data: {
        rentId: parseInt(rentId),
        businessName,
        bannerUrl,
        discription,
        workingOn,
      },
    });

    res.status(201).json(rentInfo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create RentInfo" });
  }
};

export const getRentInfo = async (req, res) => {
  const { rentId } = req.params;

  try {
    const rentInfo = await prisma.rentInfo.findUnique({
      where: { rentId: parseInt(rentId) },
    });

    if (!rentInfo) {
      return res.status(404).json({ message: "RentInfo not found" });
    }

    res.json(rentInfo);
  } catch (error) {
    console.error("Error fetching RentInfo:", error);
    res.status(500).json({ message: "Failed to fetch RentInfo" });
  }
};

export const updateRentInfo = async (req, res) => {
  const { rentId } = req.params;
  const { businessName, discription, workingOn } = req.body;
  const file = req.file;

  try {
    const existing = await prisma.rentInfo.findUnique({
      where: { rentId: parseInt(rentId) },
    });

    if (!existing) {
      return res.status(404).json({ message: "RentInfo not found" });
    }

    // If file exists, update bannerUrl; otherwise, keep the old one
    const bannerUrl = file
      ? `/uploads/banner/${file.filename}`
      : existing.bannerUrl;

    const updated = await prisma.rentInfo.update({
      where: { rentId: parseInt(rentId) },
      data: {
        businessName,
        discription,
        workingOn,
        bannerUrl,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update RentInfo" });
  }
};
