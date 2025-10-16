// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");

const { authenticateGymOwner } = require("./middlewares/authMiddleware");

const app = express();

// CORS configuration
app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running!",
    timestamp: new Date(),
  });
});

// Connect to Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);

// Protected test route (optional)
app.get("/api/test-protected", authenticateGymOwner, (req, res) => {
  res.json({
    success: true,
    message: "Protected route accessed!",
    gymOwner: req.gymOwner,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on PORT: ${PORT}`);
});
