require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const fraudRoutes = require("./routes/fraudRoutes");
const { seedDatabase } = require("./services/seeder");

const app = express();

app.use(cors());
app.use(express.json());

// Mount Fraud Intelligence API
app.use("/api/fraud", fraudRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ChainSight Fraud Detection Engine",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await seedDatabase(false);
    app.listen(PORT, () => {
      console.log(`ChainSight Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
  });
