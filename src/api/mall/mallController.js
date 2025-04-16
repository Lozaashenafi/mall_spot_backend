import multer from "multer";
import mallSchema from "./mallSchema.js";
import prisma from "../../config/prismaClient.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const { OAuth2 } = google.auth;

export const listPricePerCare = async (req, res) => {
  const { mallId } = req.query;

  if (!mallId) {
    return res.status(400).json({ message: "Mall ID is required." });
  }

  try {
    const prices = await prisma.pricePerCare.findMany({
      where: { mallId: parseInt(mallId) },
      select: {
        price: true,
        floor: true, // Select floor ID
        Floor: {
          // Join with Floor table to get the description
          select: {
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" }, // Optionally order by creation date
    });

    if (!prices || prices.length === 0) {
      return res
        .status(404)
        .json({ message: "No price records found for this mall." });
    }

    // Map the result to include only floor description and price
    const formattedPrices = prices.map((price) => ({
      price: price.price,
      floorDescription: price.Floor?.description || "No floor", // Handle cases where Floor is null
    }));

    return res.json(formattedPrices);
  } catch (error) {
    console.error("Error fetching prices by mallId:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
export const getMallOwners = async (req, res) => {
  try {
    // Fetch all mall owners
    const mallOwners = await prisma.user.findMany({
      where: {
        role: "MALL_OWNER", // Filter by the MALL_OWNER role
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        Mall: {
          // Access the related Mall
          select: {
            mallName: true, // Include mall name
          },
        },
      },
    });

    if (mallOwners.length === 0) {
      return res.status(404).json({ message: "No mall owners found." });
    }

    // Return the list of mall owners along with their associated mall information
    res.status(200).json({
      success: true,
      mallOwners: mallOwners.map((owner) => ({
        id: owner.id,
        fullName: owner.fullName,
        email: owner.email,
        phoneNumber: owner.phoneNumber,
        mallName: owner.Mall ? owner.Mall.mallName : "No mall associated", // Handle null if no mall
      })),
    });
  } catch (error) {
    console.error("Error fetching mall owners:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching mall owners",
      error: error.message,
    });
  }
};

// Use .fields() for multiple fields (mainImage, secondaryImage, tertiaryImage)
const uploadMallImages = multer({ storage }).fields([
  { name: "mainImage", maxCount: 1 },
  { name: "secondaryImage", maxCount: 1 },
  { name: "tertiaryImage", maxCount: 1 },
  { name: "invoice", maxCount: 1 },
]);

const uploadMallAgreement = multer({ storage }).single("agreementFile");
export const OwnerRegister = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword, mallId } =
      req.body;
    const mallIdInt = parseInt(mallId, 10);
    if (isNaN(mallIdInt)) {
      return res.status(400).json({ message: "Invalid mall ID" });
    }
    // Validate required fields
    if (
      !fullName ||
      !email ||
      !phoneNumber ||
      !password ||
      !confirmPassword ||
      !mallId
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const mall = await prisma.mall.findUnique({
      where: {
        id: mallIdInt, // Use the parsed integer value here
      },
    });
    if (!mall) {
      return res.status(404).json({ message: "Mall not found." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the Mall Owner using email as username
    const mallOwner = await prisma.user.create({
      data: {
        fullName,
        email,
        phoneNumber,
        password: hashedPassword,
        role: "MALL_OWNER",
        Mall: { connect: { id: mallIdInt } }, // Ensure the mallId exists
        username: email, // Set username to be the same as email
      },
    });

    res
      .status(201)
      .json({ message: "Mall Owner registered successfully.", mallOwner });
  } catch (error) {
    console.error("Error registering mall owner:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateMall = async (req, res) => {
  const { id } = req.params;

  console.log("Received update request:", req.body);
  console.log("Received files:", req.files);

  try {
    const existingMall = await prisma.mall.findUnique({
      where: { id: parseInt(id) },
      include: { mallImage: true },
    });

    if (!existingMall) {
      return res
        .status(404)
        .json({ success: false, message: "Mall not found" });
    }

    const updateData = {};
    if (req.body.mallName) updateData.mallName = req.body.mallName;
    if (req.body.address) updateData.address = req.body.address;
    if (req.body.description) updateData.description = req.body.description;

    // ✅ Parse numeric fields properly
    if (req.body.latitude) updateData.latitude = parseFloat(req.body.latitude);
    if (req.body.longitude)
      updateData.longitude = parseFloat(req.body.longitude);
    if (req.body.totalFloors)
      updateData.totalFloors = parseInt(req.body.totalFloors);
    if (req.body.totalRooms)
      updateData.totalRooms = parseInt(req.body.totalRooms);

    console.log("Processed update data:", updateData);

    let updatedMall;
    if (Object.keys(updateData).length > 0) {
      updatedMall = await prisma.mall.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      console.log("Mall updated:", updatedMall);
    } else {
      console.log("No changes detected, returning existing mall.");
      updatedMall = existingMall;
    }

    // Handle image updates
    const newImages = [];
    if (req.files?.mainImage) {
      newImages.push({
        mallId: updatedMall.id,
        imageURL: `/uploads/${req.files.mainImage[0].filename}`,
      });
    }
    if (req.files?.secondaryImage) {
      newImages.push({
        mallId: updatedMall.id,
        imageURL: `/uploads/${req.files.secondaryImage[0].filename}`,
      });
    }
    if (req.files?.tertiaryImage) {
      newImages.push({
        mallId: updatedMall.id,
        imageURL: `/uploads/${req.files.tertiaryImage[0].filename}`,
      });
    }

    console.log("New images to upload:", newImages);

    if (newImages.length > 0) {
      await prisma.mallImage.deleteMany({ where: { mallId: updatedMall.id } });
      await prisma.mallImage.createMany({ data: newImages });
      console.log("Images updated successfully.");
    }

    res.status(200).json({
      success: true,
      message: "Mall updated successfully",
      mall: updatedMall,
    });
  } catch (error) {
    console.error("Error updating mall:", error);
    res.status(500).json({
      success: false,
      message: "Error updating mall",
      error: error.message,
    });
  }
};

export const registerMall = async (req, res) => {
  try {
    // Validate incoming request using Joi
    const { error } = mallSchema.register.validate(req.body, {
      abortEarly: false,
    });

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const {
      mallName,
      latitude,
      longitude,
      address,
      description,
      totalFloors,
      totalRooms,
    } = req.body;

    // Convert numeric values
    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);
    const parsedTotalFloors = parseInt(totalFloors);
    const parsedTotalRooms = parseInt(totalRooms);

    if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid latitude or longitude" });
    }

    if (isNaN(parsedTotalFloors) || isNaN(parsedTotalRooms)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid totalFloors or totalRooms" });
    }

    // Create Mall entry
    const mall = await prisma.mall.create({
      data: {
        mallName,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        address,
        description,
        totalFloors: parsedTotalFloors,
        totalRooms: parsedTotalRooms,
      },
    });

    // Save images if uploaded
    const images = [];
    if (req.files?.mainImage) {
      images.push({
        mallId: mall.id,
        imageURL: `/uploads/${req.files.mainImage[0].filename}`,
      });
    }
    if (req.files?.secondaryImage) {
      images.push({
        mallId: mall.id,
        imageURL: `/uploads/${req.files.secondaryImage[0].filename}`,
      });
    }
    if (req.files?.tertiaryImage) {
      images.push({
        mallId: mall.id,
        imageURL: `/uploads/${req.files.tertiaryImage[0].filename}`,
      });
    }

    if (images.length > 0) {
      await prisma.mallImage.createMany({ data: images });
    }

    res.status(201).json({
      success: true,
      message: "Mall registered successfully",
      mall,
    });
  } catch (error) {
    console.error("Error in registerMall:", error); // Log error details
    res.status(500).json({
      success: false,
      message: "Error registering mall",
      error: error.message,
    });
  }
};
export const registerMallByItself = async (req, res) => {
  try {
    // Validate incoming request using Joi
    const { error } = mallSchema.register.validate(req.body, {
      abortEarly: false,
    });

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const {
      mallName,
      latitude,
      longitude,
      address,
      description,
      totalFloors,
      totalRooms,
      userFullName, // User's full name
      userEmail, // User's email
      userPassword, // User's password
    } = req.body;

    // Convert numeric values
    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);
    const parsedTotalFloors = parseInt(totalFloors);
    const parsedTotalRooms = parseInt(totalRooms);

    if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid latitude or longitude" });
    }

    if (isNaN(parsedTotalFloors) || isNaN(parsedTotalRooms)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid totalFloors or totalRooms" });
    }

    // Create Mall entry
    const mall = await prisma.mall.create({
      data: {
        mallName,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        address,
        description,
        totalFloors: parsedTotalFloors,
        totalRooms: parsedTotalRooms,
      },
    });

    // Save images if uploaded
    const images = [];
    if (req.files?.mainImage) {
      images.push({
        mallId: mall.id,
        imageURL: `/uploads/${req.files.mainImage[0].filename}`,
      });
    }
    if (req.files?.secondaryImage) {
      images.push({
        mallId: mall.id,
        imageURL: `/uploads/${req.files.secondaryImage[0].filename}`,
      });
    }
    if (req.files?.tertiaryImage) {
      images.push({
        mallId: mall.id,
        imageURL: `/uploads/${req.files.tertiaryImage[0].filename}`,
      });
    }

    if (images.length > 0) {
      await prisma.mallImage.createMany({ data: images });
    }

    // Save invoice if uploaded
    if (req.files?.invoice) {
      const invoiceFile = req.files.invoice[0];
      const invoiceURL = `/uploads/${invoiceFile.filename}`;

      // Create an Invoice entry
      await prisma.invoice.create({
        data: {
          mallId: mall.id,
          invoiceURL,
          flag: "false", // Set flag to false until verified by admin
        },
      });
    }

    // Create User (Mall Owner or User) and set status to INACTIVE
    const user = await prisma.user.create({
      data: {
        fullName: userFullName,
        email: userEmail,
        username: userEmail,
        password: userPassword, // Ensure password is hashed before saving
        role: "MALL_OWNER",
        status: "INACTIVE", // Set the user status to INACTIVE
        mallId: mall.id, // Link the user to the created mall
      },
    });

    res.status(201).json({
      success: true,
      message: "Mall and user registered successfully",
      mall,
      user,
    });
  } catch (error) {
    console.error("Error in registerMall:", error); // Log error details
    res.status(500).json({
      success: false,
      message: "Error registering mall",
      error: error.message,
    });
  }
};

export const getMalls = async (req, res) => {
  try {
    const malls = await prisma.mall.findMany({
      include: {
        mallImage: true, // Include related images
      },
    });

    const formattedMalls = malls.map((mall) => ({
      id: mall.id, // Include Mall ID
      mallName: mall.mallName,
      address: mall.address,
      description: mall.description,
      totalFloors: mall.totalFloors,
      totalRooms: mall.totalRooms,
      image: mall.mallImage.length > 0 ? mall.mallImage[0].imageURL : null, // Get only the first image
    }));

    res.status(200).json({
      success: true,
      malls: formattedMalls,
    });
  } catch (error) {
    console.error("Error fetching malls:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching malls",
      error: error.message,
    });
  }
};

export const getMallById = async (req, res) => {
  const { id } = req.params;

  try {
    const mall = await prisma.mall.findUnique({
      where: { id: parseInt(id) },
      include: {
        mallImage: true, // Include images
      },
    });

    if (!mall) {
      return res
        .status(404)
        .json({ success: false, message: "Mall not found" });
    }

    const formattedMall = {
      ...mall,
      images: mall.mallImage.map((img) => img.imageURL), // Extract image URLs
    };

    res.status(200).json({
      success: true,
      mall: formattedMall,
    });
  } catch (error) {
    console.error("Error fetching mall by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching mall",
      error: error.message,
    });
  }
};
export const getMallDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const mall = await prisma.mall.findUnique({
      where: { id: parseInt(id) },
      include: {
        mallImage: true, // Include images
        agreements: true, // Include rental agreements
        pricePerCare: true, // Include price per care
      },
    });

    if (!mall) {
      return res
        .status(404)
        .json({ success: false, message: "Mall not found" });
    }

    const formattedMall = {
      ...mall,
      images: mall.mallImage.map((img) => img.imageURL), // Extract image URLs
      roomCount: mall.totalRooms, // Include total rooms
      floorCount: mall.totalFloors, // Include total floors
      rentalAgreements: mall.agreements.map(
        (agreement) => agreement.agreementFile
      ), // Extract agreement file URLs
      pricePerCare:
        mall.pricePerCare.length > 0 ? mall.pricePerCare[0].price : null, // Extract price per care
    };

    res.status(200).json({
      success: true,
      mall: formattedMall,
    });
  } catch (error) {
    console.error("Error fetching mall by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching mall",
      error: error.message,
    });
  }
};

export const mallInfo = async (req, res) => {
  try {
    const { mallId, basementCount, floorCount, roomCount, pricePerCare } =
      req.body;
    const mallIdInt = parseInt(mallId, 10);
    const basements = parseInt(basementCount, 10);
    const floors = parseInt(floorCount, 10);
    const totalRooms = parseInt(roomCount, 10);
    const price = parseFloat(pricePerCare); // Convert pricePerCare to Float
    const agreementFile = req.file; // The uploaded file

    if (!agreementFile) {
      return res.status(400).json({ message: "No agreement file uploaded" });
    }
    if (
      isNaN(mallIdInt) ||
      isNaN(basements) ||
      isNaN(floors) ||
      isNaN(totalRooms) ||
      isNaN(price)
    ) {
      return res.status(400).json({ message: "Invalid input values." });
    }

    // Check if mall exists
    const mall = await prisma.mall.findUnique({ where: { id: mallIdInt } });
    if (!mall) return res.status(404).json({ message: "Mall not found." });

    // Create floors & basements dynamically
    const floorData = [];

    for (let i = 1; i <= basements; i++) {
      floorData.push({
        mallId: mallIdInt,
        floorNumber: -i,
        description: `Basement ${i}`,
      });
    }

    for (let i = 1; i <= floors; i++) {
      floorData.push({
        mallId: mallIdInt,
        floorNumber: i,
        description: `Floor ${i}`,
      });
    }

    await prisma.floor.createMany({ data: floorData });

    // Save agreement file
    let agreementPath = null;
    if (req.file) {
      agreementPath = `/uploads/${req.file.filename}`;
      await prisma.agreement.create({
        data: {
          mallId: mallIdInt,
          agreementFile: agreementPath,
        },
      });
    }

    // Save Price Per Care
    await prisma.pricePerCare.create({
      data: {
        mallId: mallIdInt,
        price,
      },
    });

    // Update mall total rooms
    await prisma.mall.update({
      where: { id: mallIdInt },
      data: { totalRooms },
    });

    res.status(201).json({
      message:
        "Mall floors, basements, price per care, and agreement saved successfully!",
      agreementFile: agreementPath,
    });
  } catch (error) {
    console.error("Error saving mall info:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const addPricePerCare = async (req, res) => {
  const { mallId, price, floorId } = req.body;

  // Validate input
  if (!mallId || !price) {
    return res.status(400).json({ message: "Mall ID and price are required." });
  }

  try {
    // Check if there is already a price for this mall and floor
    const existingPrice = await prisma.pricePerCare.findFirst({
      where: {
        mallId: parseInt(mallId, 10),
        floor: floorId ? parseInt(floorId, 10) : null, // Only check floor if floorId is provided
      },
    });

    if (existingPrice) {
      // If price exists, update it
      const updatedPrice = await prisma.pricePerCare.update({
        where: { id: existingPrice.id },
        data: { price: parseFloat(price) },
      });

      return res.status(200).json({
        success: true,
        message: "Price per care updated successfully.",
        data: updatedPrice,
      });
    } else {
      // If no price exists for the given floor, create a new price
      const newPrice = await prisma.pricePerCare.create({
        data: {
          mallId: parseInt(mallId, 10),
          price: parseFloat(price),
          floor: floorId ? parseInt(floorId, 10) : null, // Handle optional floorId
        },
      });

      return res.status(201).json({
        success: true,
        message: "Price per care added successfully.",
        data: newPrice,
      });
    }
  } catch (error) {
    console.error("Error adding price per care:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getPendingMalls = async (req, res) => {
  try {
    // Fetch malls with invoices that are pending review (flag = 'false')
    const malls = await prisma.mall.findMany({
      where: {
        invoice: {
          some: {
            flag: "false", // Only malls with pending invoices
          },
        },
      },
      include: {
        invoice: true, // Include invoice details in the response
        mallImage: true, // Include mall images if necessary
      },
    });

    if (!malls.length) {
      return res.status(404).json({
        success: false,
        message: "No malls pending review",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pending malls fetched successfully",
      malls,
    });
  } catch (error) {
    console.error("Error fetching pending malls:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending malls",
      error: error.message,
    });
  }
};
export const approveMall = async (req, res) => {
  const { mallId } = req.body;

  try {
    const mall = await prisma.mall.findUnique({
      where: { id: mallId },
      include: {
        invoice: true,
      },
    });

    if (!mall) {
      return res.status(404).json({
        success: false,
        message: "Mall not found",
      });
    }
    // Find the user associated with this mall
    const user = await prisma.user.findFirst({
      where: { mallId: mallId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found for this mall",
      });
    }

    // Update user status
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "ACTIVE" },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App password if 2FA is enabled
      },
      secure: true, // Use SSL
      port: 465,
    });

    const mailOptions = {
      from: '"MallSpot Team" <MallSpot@gmail.com>',
      to: user.email,
      subject: "Your Mall Registration is Approved!",
      html: `
        <p>Dear ${user.username},</p>
        <p>Congratulations! Your mall <strong>${mall.mallName}</strong> has been approved in <strong>MallSpot</strong>.</p>
        <p>You can now log in to the system using your registered email and password.</p>
        <p>Welcome aboard!</p>
        <br />
        <p>Best regards,</p>
        <p><strong>MallSpot Team</strong></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Update invoice flag if present
    if (mall.invoice && mall.invoice.length > 0) {
      await prisma.invoice.updateMany({
        where: { mallId: mall.id },
        data: {
          flag: "true",
        },
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Mall approved, user status activated, invoice updated, and email sent",
      mall,
    });
  } catch (error) {
    console.error("Error in approveMall:", error);
    res.status(500).json({
      success: false,
      message: "Error approving mall",
      error: error.message,
    });
  }
};

// Middleware for image upload (use .fields() to handle multiple fields)
export const uploadMallImagesMiddleware = uploadMallImages;
export const uploadAgreement = uploadMallAgreement;
