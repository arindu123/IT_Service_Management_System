const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

// Load .env file
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const assetRoutes = require("./routes/assetRoutes");
const assetIssueRoutes = require("./routes/assetIssueRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const repairRoutes = require("./routes/repairRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const networkRoutes = require("./routes/networkRoutes");
const { startNetworkMonitorScheduler } = require("./services/networkMonitorScheduler");

const app = express();

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(helmet());
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/asset-issues", assetIssueRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/repairs", repairRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/network", networkRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("IT Service Management System API is running...");
});

app.use((req, res) => res.status(404).json({ message: "Resource not found" }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(error);
  res.status(error.statusCode || 500).json({ message: "An unexpected server error occurred" });
});

// Port
const PORT = process.env.PORT || 5000;

// Start server after MongoDB is ready so background workers can safely use models.
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startNetworkMonitorScheduler();
  });
};

startServer();
