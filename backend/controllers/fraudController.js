const Alert = require("../models/Alert");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Event = require("../models/Event");
const { getAccountGraphData } = require("../services/graphEngine");
const { seedDatabase } = require("../services/seeder");

// Get overall dashboard summary metrics & active triage alerts
exports.getDashboardSummary = async (req, res) => {
  try {
    const [totalUsers, alerts, transactions] = await Promise.all([
      User.countDocuments(),
      Alert.find().sort({ detectedAt: -1 }).limit(10).lean(),
      Transaction.find().sort({ timestamp: -1 }).limit(20).lean(),
    ]);

    const activeAlertsCount = await Alert.countDocuments({
      status: { $in: ["NEW", "UNDER_REVIEW", "VERIFY_SENT", "HELD"] },
    });

    const highOrCriticalCount = await Alert.countDocuments({
      severity: { $in: ["HIGH", "CRITICAL"] },
    });

    const heldTxs = await Transaction.find({
      status: { $in: ["HELD", "BLOCKED", "VERIFY_REQUIRED"] },
    }).lean();
    const preventedFraudVolume = heldTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const mulePatterns = await Transaction.distinct("destAccount", {
      networkPattern: { $in: ["FAN_IN", "RAPID_PASS_THROUGH", "CIRCULAR"] },
    });

    res.json({
      success: true,
      kpis: {
        totalMonitoredAccounts: totalUsers,
        activeAtoIncidents: activeAlertsCount,
        criticalThreats: highOrCriticalCount,
        preventedFraudVolume,
        flaggedMuleAccounts: mulePatterns.length,
      },
      alerts,
      recentTransactions: transactions,
    });
  } catch (error) {
    console.error("Error in getDashboardSummary:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get list of alerts
exports.getAlerts = async (req, res) => {
  try {
    const { severity, status } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    const alerts = await Alert.find(filter).sort({ detectedAt: -1 }).lean();
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single alert detail
exports.getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findOne({ alertId: req.params.alertId }).lean();
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    const [user, transaction, graphData] = await Promise.all([
      User.findOne({ userId: alert.userId }).lean(),
      Transaction.findOne({ txId: alert.targetTransactionId }).lean(),
      getAccountGraphData(alert.destAccount),
    ]);

    res.json({
      success: true,
      alert,
      user,
      transaction,
      graphData,
    });
  } catch (error)
 {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Analyst response actions: MONITOR, VERIFY, HOLD, ALERT_BLOCK, RELEASE
exports.updateAlertAction = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { action, note, author } = req.body;

    const alert = await Alert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    let newAlertStatus = alert.status;
    let newTxStatus = "PENDING";

    switch (action) {
      case "MONITOR":
      case "RELEASE":
        newAlertStatus = "RESOLVED_BENIGN";
        newTxStatus = "APPROVED";
        break;
      case "VERIFY":
        newAlertStatus = "VERIFY_SENT";
        newTxStatus = "VERIFY_REQUIRED";
        break;
      case "HOLD":
        newAlertStatus = "HELD";
        newTxStatus = "HELD";
        break;
      case "ALERT":
      case "BLOCK":
        newAlertStatus = "BLOCKED";
        newTxStatus = "BLOCKED";
        break;
      default:
        newAlertStatus = "UNDER_REVIEW";
    }

    alert.status = newAlertStatus;
    alert.analystNotes.push({
      action: action.toUpperCase(),
      note: note || `Analyst executed action: ${action}`,
      author: author || "SecOps Analyst",
      timestamp: new Date(),
    });

    await alert.save();

    if (alert.targetTransactionId) {
      await Transaction.updateOne(
        { txId: alert.targetTransactionId },
        { $set: { status: newTxStatus, actionTaken: action } }
      );
    }

    res.json({
      success: true,
      message: `Action '${action}' applied successfully.`,
      alert,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get interactive graph nodes/edges for an account
exports.getGraphData = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const graphData = await getAccountGraphData(accountNumber);
    res.json({ success: true, data: graphData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Interactive step-by-step simulator
exports.simulateStep = async (req, res) => {
  try {
    const { stepNumber } = req.body;

    const stepsData = [
      {
        step: 1,
        title: "Step 1: New Device Login",
        eventType: "LOGIN",
        device: "Unknown Linux / Tor Exit Node",
        ip: "185.220.101.5",
        location: "St. Petersburg, Russia",
        riskDelta: 25,
        cumulativeScore: 25,
        severity: "LOW",
        recommendedAction: "MONITOR",
        details: "New device signature detected outside habitual US West Coast locations.",
      },
      {
        step: 2,
        title: "Step 2: Rapid Password Reset",
        eventType: "PASSWORD_CHANGE",
        device: "Unknown Linux / Tor Exit Node",
        ip: "185.220.101.5",
        location: "St. Petersburg, Russia",
        riskDelta: 25,
        cumulativeScore: 50,
        severity: "MEDIUM",
        recommendedAction: "VERIFY",
        details: "Password credential reset 4 minutes post-login. Threshold for account takeover warning exceeded.",
      },
      {
        step: 3,
        title: "Step 3: New External Beneficiary Added",
        eventType: "BENEFICIARY_ADDED",
        device: "Unknown Linux / Tor Exit Node",
        ip: "185.220.101.5",
        location: "St. Petersburg, Russia",
        riskDelta: 25,
        cumulativeScore: 75,
        severity: "HIGH",
        recommendedAction: "HOLD",
        details: "Added unverified beneficiary 'Apex Global Holdings LLC' 6 minutes post-password reset.",
      },
      {
        step: 4,
        title: "Step 4: High-Value Wire Transfer Attempt",
        eventType: "TRANSFER_ATTEMPT",
        device: "Unknown Linux / Tor Exit Node",
        amount: 24500,
        riskDelta: 21,
        cumulativeScore: 96,
        severity: "CRITICAL",
        recommendedAction: "ALERT",
        details: "Attempted $24,500 wire (70x user average). Destination is identified as a rapid pass-through mule account. Automatic block & session kill triggered.",
      },
    ];

    const currentStep = stepsData.find((s) => s.step === Number(stepNumber)) || stepsData[0];

    res.json({
      success: true,
      currentStep,
      allSteps: stepsData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reset & reseed database
exports.reseed = async (req, res) => {
  try {
    await seedDatabase(true);
    res.json({ success: true, message: "Database reseeded successfully with synthetic demo data." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
