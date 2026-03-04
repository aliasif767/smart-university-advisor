// server.js - Updated with Student Dashboard Integration + Teacher Routes + Advisor Routes
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import studentDashboardRoutes from "./routes/studentDashboard.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import advisorRoutes from "./routes/advisorRoutes.js";
import hopRoutes from "./routes/hopRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { setupSocketHandlers } from "./utils/socketHandlers.js";

// ES6 module path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// Connect to MongoDB
connectDB();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
  }),
);
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/students", studentDashboardRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/advisors", advisorRoutes);
app.use("/api/hop",      hopRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Smart Advisor Backend is running",
    timestamp: new Date().toISOString(),
    services: {
      database:        "connected",
      studentDashboard: "active",
      teacherDashboard: "active",
      advisorDashboard: "active",
      fileUpload:       "enabled"
    }
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Smart Advisor API",
    version: "1.0.0",
    endpoints: {
      auth:     "/api/auth",
      students: "/api/students",
      teachers: "/api/teachers",
      advisors: "/api/advisors",
      health:   "/health"
    }
  });
});

// Socket.IO setup
setupSocketHandlers(io);

// Error handling middleware (must be after all routes)
app.use(errorHandler);

// 404 handler (must be last)
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    availableRoutes: [
      "/api/auth",
      "/api/students",
      "/api/teachers",
      "/api/advisors",
      "/health"
    ]
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║            Smart Advisor System - Backend Server             ║
╚══════════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
📡 Socket.IO server active
🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:8080"}

📋 Active Routes:
   ✅ /api/auth         - Authentication
   ✅ /api/students     - Student Dashboard
   ✅ /api/teachers     - Teacher Dashboard
   ✅ /api/advisors     - Advisor Dashboard
   ✅ /api/hop          - HOP Dashboard
   ✅ /health           - Health Check

📁 File uploads enabled at /uploads
  `);
});

export { io };