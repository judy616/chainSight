const Alert = require("../models/Alert");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Event = require("../models/Event");
const { getAccountGraphData } = require("../services/graphEngine");
const { seedDatabase } = require("../services/seeder");
const { correlateAttackChain } = require("../services/correlator");

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


// Interactive step-by-step simulator wired to real correlation engine
exports.simulateStep = async (req, res) => {
  try {
    const { stepNumber, userId = "USR-8491" } = req.body;
    const step = Math.max(1, Math.min(4, Number(stepNumber) || 1));

    const now = Date.now();
    const baseTime = now - 9 * 60 * 1000;

    const simEvents = [
      {
        eventId: "SIM-EV-01",
        userId,
        eventType: "NEW_DEVICE_LOGIN",
        deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
        isNewDevice: true,
        ipAddress: "185.220.101.5",
        isSuspiciousIp: true,
        location: "St. Petersburg, Russia",
        timestamp: new Date(baseTime),
        metadata: { isUntrusted: true, userAgent: "Mozilla/5.0 (Tor Browser)" },
      },
      {
        eventId: "SIM-EV-02",
        userId,
        eventType: "PASSWORD_RESET",
        deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
        isNewDevice: true,
        ipAddress: "185.220.101.5",
        location: "St. Petersburg, Russia",
        timestamp: new Date(baseTime + 3 * 60 * 1000), // +3m
        metadata: { method: "SMS_OTP_BYPASS" },
      },
      {
        eventId: "SIM-EV-03",
        userId,
        eventType: "BENEFICIARY_ADDED",
        deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
        isNewDevice: true,
        ipAddress: "185.220.101.5",
        location: "St. Petersburg, Russia",
        timestamp: new Date(baseTime + 5 * 60 * 1000), // +5m (+2m from pwd)
        metadata: {
          beneficiaryAccount: "ACC-MULE-902",
          beneficiaryName: "Apex Global Holdings LLC (Mule)",
        },
      },
      {
        eventId: "SIM-EV-04",
        userId,
        eventType: "TRANSFER_ATTEMPT",
        deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
        isNewDevice: true,
        ipAddress: "185.220.101.5",
        location: "St. Petersburg, Russia",
        timestamp: new Date(baseTime + 9 * 60 * 1000), // +9m (+4m from payee)
        metadata: {
          amount: 24500,
          destAccount: "ACC-MULE-902",
          destAccountName: "Apex Global Holdings LLC (Mule)",
        },
      },
    ];

    const activeSlice = simEvents.slice(0, step);
    const latestEvent = activeSlice[activeSlice.length - 1];

    const chainState = await correlateAttackChain({
      userId,
      eventsList: activeSlice,
      referenceTime: latestEvent.timestamp,
      timeWindowMinutes: 60,
    });

    const currentEvaluated = chainState.chainEvents[chainState.chainEvents.length - 1];

    const currentStep = {
      step,
      title: `Phase ${step}: ${currentEvaluated.label}`,
      eventType: currentEvaluated.eventType,
      device: currentEvaluated.device,
      ip: currentEvaluated.ip,
      location: currentEvaluated.location,
      timestamp: currentEvaluated.formattedDelta,
      riskDelta: currentEvaluated.riskDelta,
      cumulativeScore: chainState.cumulativeRiskScore,
      severity: chainState.severity,
      policyResponse: chainState.recommendedAction,
      details: currentEvaluated.explanation,
      velocitySignals: chainState.velocitySignals,
      ruleFired: currentEvaluated.ruleFired,
    };

    res.json({
      success: true,
      currentStep,
      chainState,
    });
  } catch (error) {
    console.error("Error in simulateStep:", error);
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


// Ingest a single security event and correlate live attack chain
exports.ingestEvent = async (req, res) => {
  try {
    const {
      userId,
      eventType,
      deviceFingerprint,
      ipAddress,
      location,
      isNewDevice,
      isSuspiciousIp,
      timestamp,
      metadata,
    } = req.body;

    if (!userId || !eventType) {
      return res.status(400).json({ success: false, message: "userId and eventType are required." });
    }

    const eventId = req.body.eventId || `EV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const eventTime = timestamp ? new Date(timestamp) : new Date();

    const newEvent = await Event.create({
      eventId,
      userId,
      eventType,
      deviceFingerprint: deviceFingerprint || "Unknown Device",
      isNewDevice: Boolean(isNewDevice),
      ipAddress: ipAddress || "0.0.0.0",
      isSuspiciousIp: Boolean(isSuspiciousIp),
      location: location || "Unknown Location",
      timestamp: eventTime,
      metadata: metadata || {},
    });

    const windowMinutes = Number(req.query.window || 60);
    const chainState = await correlateAttackChain({
      userId,
      timeWindowMinutes: windowMinutes,
      referenceTime: eventTime,
    });

    // If composite score elevated (>= 40), upsert or create active alert
    if (chainState.cumulativeRiskScore >= 40) {
      const user = await User.findOne({ userId }).lean();
      const existingAlert = await Alert.findOne({
        userId,
        status: { $in: ["NEW", "UNDER_REVIEW", "VERIFY_SENT", "HELD"] },
      }).sort({ detectedAt: -1 });

      const alertPayload = {
        userId,
        userName: user?.name || "Account Holder",
        sourceAccount: user?.accountNumber || "ACC-UNKNOWN",
        targetTransactionId: metadata?.txId || `PENDING-SEQ-${Date.now()}`,
        targetAmount: metadata?.amount || 0,
        destAccount: metadata?.beneficiaryAccount || metadata?.destAccount || "PENDING",
        destAccountName: metadata?.beneficiaryName || metadata?.destAccountName || "Pending Destination",
        detectedAt: eventTime,
        compositeRiskScore: chainState.cumulativeRiskScore,
        severity: chainState.severity,
        recommendedAction: chainState.recommendedAction,
        attackChain: {
          sequenceDetected: chainState.isFullSequence,
          timeWindowMinutes: windowMinutes,
          events: chainState.chainEvents,
        },
        explanations: chainState.explanations,
      };

      if (existingAlert) {
        existingAlert.compositeRiskScore = chainState.cumulativeRiskScore;
        existingAlert.severity = chainState.severity;
        existingAlert.recommendedAction = chainState.recommendedAction;
        existingAlert.attackChain = alertPayload.attackChain;
        existingAlert.explanations = alertPayload.explanations;
        existingAlert.detectedAt = eventTime;
        await existingAlert.save();
      } else {
        await Alert.create({
          alertId: `ALT-${Date.now().toString().slice(-6)}`,
          ...alertPayload,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Event ingested and correlated successfully.",
      event: newEvent,
      chainState,
    });
  } catch (error) {
    console.error("Error in ingestEvent:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Retrieve current attack chain for a specific user
exports.getAttackChain = async (req, res) => {
  try {
    const { userId } = req.params;
    const windowMinutes = Number(req.query.window || 60);

    const chainState = await correlateAttackChain({
      userId,
      timeWindowMinutes: windowMinutes,
    });

    res.json({
      success: true,
      chainState,
    });
  } catch (error) {
    console.error("Error in getAttackChain:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
