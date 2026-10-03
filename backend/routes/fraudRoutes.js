const express = require("express");
const router = express.Router();
const fraudController = require("../controllers/fraudController");

router.get("/dashboard-summary", fraudController.getDashboardSummary);
router.get("/alerts", fraudController.getAlerts);
router.get("/alerts/:alertId", fraudController.getAlertById);
router.post("/alerts/:alertId/action", fraudController.updateAlertAction);
router.get("/graph/:accountNumber", fraudController.getGraphData);
router.post("/simulate-step", fraudController.simulateStep);
router.post("/reseed", fraudController.reseed);

// Feature 1: Attack-Chain Correlation Endpoints
router.post("/events", fraudController.ingestEvent);
router.get("/attack-chain/:userId", fraudController.getAttackChain);

module.exports = router;
