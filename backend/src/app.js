const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { corsOrigin, nodeEnv, rateLimitWindowMs, rateLimitMax } = require("./config/env");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const specializationRoutes = require("./routes/specializationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");

const app = express();

// --- Security & core middleware ---
app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
if (nodeEnv === "development") app.use(morgan("dev"));

// --- Basic rate limiting (applies to all /api routes) ---
const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api", limiter);

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is healthy", timestamp: new Date().toISOString() });
});

// --- Feature routes ---
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/medical-records", medicalRecordRoutes);

// --- 404 + centralized error handler (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
