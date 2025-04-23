import prisma from "../../../config/prismaClient.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/profile/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single("file");

export const getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        profile: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  const { id } = req.params;
  const { bio } = req.body;

  const profileImage = req.file
    ? `/uploads/profile/${req.file.filename}`
    : null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: Number(id) },
    });

    let profile;

    if (existingProfile) {
      profile = await prisma.profile.update({
        where: { userId: Number(id) },
        data: {
          bio,
          ...(profileImage && { profileImage }), // update only if image exists
        },
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          userId: Number(id),
          bio,
          ...(profileImage && { profileImage }),
        },
      });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error saving profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  const { id } = req.params; // User ID
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: Number(id) },
      data: { password: hashedNewPassword },
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
