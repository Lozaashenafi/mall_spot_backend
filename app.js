import dotenv from "dotenv";
dotenv.config(); // Load environment variables first

import express from "express";
import config from "./src/config/index.js";
import middleware from "./src/middleware/index.js";
import routes from "./src/route/index.js";
import cors from "cors";

const app = express();
// Middleware
app.use(middleware);
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allow all HTTP methods
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  })
);

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));
// Routes
app.use("/api", routes);

app.get("/", (req, res) => {
  return res.send("runing ");
});

// Start the server, listen on all network interfaces
const PORT = config.PORT || 5000;
app.listen(PORT, "192.168.43.129", () => {
  console.log(`http://192.168.43.129:${PORT}   Server is running  `);
});
