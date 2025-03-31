import jwt from "jsonwebtoken";
import prismaClient from "../config/prismaClient.js";
const { prisma } = prismaClient;
import config from "../config/index.js";
const { JWT_SECRET } = config;

const userAuth = async (req, res, next) => {
  const token = req.headers.authorization;
  console.log(token);
  if (!token) {
    return res.status(403).json({
      message: "Token not found",
      success: false,
    });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log(payload);
    const user = await prisma.users.findFirst({
      where: {
        id: payload.id,
      },
    });
    if (!user) {
      return res.status(403).json({
        message: "User not found",
        success: false,
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid token",
      success: false,
    });
  }
};

const isAdmin = async (req, res, next) => {
  const admin = req.user;
  if (admin && admin.role !== "ADMIN") {
    return res.status(403).json({
      message: "User not admin",
      success: false,
    });
  }
  next();
};

const IsMallOwner = async (req, res, next) => {
  const admin = req.user;
  if (admin && admin.role !== "MALL_OWNER") {
    return res.status(403).json({
      message: "User not owner",
      success: false,
    });
  }
  next();
};
const IsTenant = async (req, res, next) => {
  const admin = req.user;
  if (admin && admin.role !== "TENANT") {
    return res.status(403).json({
      message: "User not tenant",
      success: false,
    });
  }
  next();
};

export { userAuth, isAdmin, IsMallOwner, IsTenant };
