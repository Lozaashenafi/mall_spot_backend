import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../../config/prismaClient.js";
import authSchema from "./appAuthSchema.js";
// Register Admin
export const register = async (req, res) => {
  try {
    // Validate request body
    const { error } = authSchema.register.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { fullName, email, password, phoneNumber } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Check if phoneNumber already exists (Use findFirst instead of findUnique)
    const existingPhone = await prisma.user.findFirst({
      where: { phoneNumber },
    });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Admin User
    const user = await prisma.user.create({
      data: {
        fullName,
        username: email, // Using email as username
        email,
        password: hashedPassword,
        phoneNumber,
        role: "USER",
        status: "ACTIVE",
      },
    });

    res
      .status(201)
      .json({ message: "User registered successfully", userId: user.id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    // Validate request body
    const { error } = authSchema.login.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { emailOrPhone, password } = req.body;

    // Find the user by email or phone number
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
      },
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Check if user is an ADMIN or MALL_OWNER
    if (user.role !== "USER" && user.role !== "TENANT")
      return res.status(403).json({ message: "Access denied" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ message: "Invalid credentials", success: false });

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      mallId: user.mallId,
      role: user.role,
      fullName: user.fullName,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "12h", // token will expire in 12 hours
    });

    res.json({ message: "Login successful", token, success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
};
