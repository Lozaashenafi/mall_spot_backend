import dotenv from "dotenv";
dotenv.config(); // Load environment variables first

import express from "express";
import config from "./src/config/index.js";
import middleware from "./src/middleware/index.js";
import routes from "./src/route/index.js";
import http from "http"; // Import http module
import { Server } from "socket.io"; // Import socket.io

const app = express();

// Create HTTP server to work with Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow any origin for Socket.IO (adjust for security in production)
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Middleware
app.use(middleware);

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api", routes);

app.get("/", (req, res) => {
  return res.send("Running...");
});

// Add your Socket.IO connection handling logic here
io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);

  // Register user with their userId for private notifications
  socket.on("registerUser", (userId) => {
    socket.join(`user-${userId}`); // Join a room for notifications
    console.log(`User ${userId} registered with socket ID ${socket.id}`);
  });

  socket.on("disconnect", () => {
    // console.log("User disconnected:", socket.id);
  });
});

// Start the server on the specified port
const PORT = config.PORT || 5000;
server.listen(PORT, () => {
  console.log(`http://localhost:${PORT} Server is running`);
});

export { io }; // Export io to use it in other files (e.g., for emitting events)
