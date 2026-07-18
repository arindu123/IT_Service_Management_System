const express = require("express");
const cors = require("cors");
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
app.use(cors());
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
