import dotenv from "dotenv";
dotenv.config(); // Ensure .env is loaded

export default {
  PORT: process.env.PORT || 3000, // Default fallback
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
};
