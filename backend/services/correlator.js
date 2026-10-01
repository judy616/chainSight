const User = require("../models/User");
const Event = require("../models/Event");
const Alert = require("../models/Alert");
const { analyzeDestinationGraph } = require("./graphEngine");

/**
 * Correlates user events within a time window to detect Account Takeover (ATO) sequence:
 * New Device Login -> Password Change -> New Beneficiary -> Large Transfer
 * Combines with Destination Account Graph Risk + Baseline Deviations.
 */
async function correlateAtoIncident({ userId, transaction, timeWindowMinutes = 60 }) {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  const recentEvents = await Event.find({
    userId,
    timestamp: { $gte: cutoff },
  })
    .sort({ timestamp: 1 })
    .lean();

  const baseline = user.baseline || {};
  const explanations = [];
  const chainEvents = [];
  let runningScore = 0;

  let hasNewDeviceLogin = false;
  let hasPasswordChange = false;
  let hasNewBeneficiary = false;
  let firstLoginTime = null;
  let passwordChangeTime = null;
  let beneficiaryAddTime = null;

  // 1. Process recent event sequence
  for (const ev of recentEvents) {
    let riskDelta = 0;
    let label = "";

    if (ev.eventType === "LOGIN") {
      firstLoginTime = new Date(ev.timestamp);
      if (ev.isNewDevice || ev.isSuspiciousIp) {
        hasNewDeviceLogin = true;
        riskDelta = 25;
        label = `Unrecognized Device Login (${ev.deviceFingerprint})`;
        explanations.push(`Suspicious Login: Access initiated from previously unseen device (${ev.deviceFingerprint}) at ${ev.location}.`);
      } else {
        label = `Nominal Login (${ev.deviceFingerprint})`;
      }
    } else if (ev.eventType === "PASSWORD_CHANGE") {
      passwordChangeTime = new Date(ev.timestamp);
      hasPasswordChange = true;
      const minsSinceLogin = firstLoginTime ? (passwordChangeTime - firstLoginTime) / (1000 * 60) : 999;
      if (minsSinceLogin <= 20) {
        riskDelta = 25;
        label = `Rapid Password Reset (${Math.round(minsSinceLogin)}m post-login)`;
        explanations.push(`Rapid Credential Modification: Password changed just ${Math.round(minsSinceLogin)} minutes after new device session.`);
      } else {
        riskDelta = 15;
        label = `Password Changed`;
        explanations.push(`Password modification detected in active session.`);
      }
    } else if (ev.eventType === "BENEFICIARY_ADDED") {
      beneficiaryAddTime = new Date(ev.timestamp);
      hasNewBeneficiary = true;
      const minsSincePwd = passwordChangeTime ? (beneficiaryAddTime - passwordChangeTime) / (1000 * 60) : 999;
      if (minsSincePwd <= 25) {
        riskDelta = 25;
        label = `Immediate Beneficiary Addition (${ev.metadata?.beneficiaryName || "External Recipient"})`;
        explanations.push(`Fast Payee Addition: Added new beneficiary '${ev.metadata?.beneficiaryName || ev.metadata?.beneficiaryAccount}' shortly after password reset.`);
      } else {
        riskDelta = 10;
        label = `New Beneficiary Added`;
      }
    }

    runningScore = Math.min(100, runningScore + riskDelta);

    const deltaMins = firstLoginTime ? Math.max(0, Math.round((new Date(ev.timestamp) - firstLoginTime) / (1000 * 60))) : 0;

    chainEvents.push({
      eventId: ev.eventId,
      eventType: ev.eventType,
      label: label || ev.eventType,
      device: ev.deviceFingerprint,
      location: ev.location,
      ip: ev.ipAddress,
      timestamp: ev.timestamp,
      deltaMinutes: deltaMins,
      riskDelta,
      runningScore,
      status: riskDelta > 0 ? "SUSPICIOUS" : "NORMAL",
    });
  }

  // 2. Evaluate Current Transfer Event
  let transferRiskDelta = 0;
  let transferLabel = `Transfer Attempt ($${transaction.amount.toLocaleString()})`;

  // Is transfer going to newly added beneficiary?
  const isTargetNewBeneficiary = hasNewBeneficiary || !baseline.trustedBeneficiaries?.includes(transaction.destAccount);
  if (isTargetNewBeneficiary) {
    transferRiskDelta += 20;
    explanations.push(`Unverified Destination: Transfer targeted to newly introduced beneficiary '${transaction.destAccountName || transaction.destAccount}'.`);
  }

  // Baseline amount deviation
  const avgAmount = baseline.avgTransferAmount || 250;
  const amountRatio = transaction.amount / avgAmount;
  if (amountRatio >= 10) {
    transferRiskDelta += 25;
    explanations.push(`Extreme Amount Outlier: $${transaction.amount.toLocaleString()} is ${amountRatio.toFixed(1)}x user's 30-day baseline average ($${avgAmount}).`);
  } else if (amountRatio >= 3) {
    transferRiskDelta += 15;
    explanations.push(`Substantial Amount Spike: $${transaction.amount.toLocaleString()} is ${amountRatio.toFixed(1)}x user's baseline average ($${avgAmount}).`);
  }

  // Baseline hour deviation
  const txHour = new Date(transaction.timestamp || Date.now()).getHours();
  const isUnusualHour = Array.isArray(baseline.typicalHours) && !baseline.typicalHours.includes(txHour);
  if (isUnusualHour) {
    transferRiskDelta += 10;
    explanations.push(`Temporal Anomaly: Transaction attempted at ${txHour}:00 (outside user typical activity window).`);
  }

  runningScore = Math.min(100, runningScore + transferRiskDelta);

  const txDeltaMins = firstLoginTime ? Math.max(0, Math.round((new Date(transaction.timestamp) - firstLoginTime) / (1000 * 60))) : 42;

  chainEvents.push({
    eventId: `EV-TX-${transaction.txId}`,
    eventType: "TRANSFER_ATTEMPT",
    label: transferLabel,
    device: chainEvents[0]?.device || "Active Session Device",
    location: chainEvents[0]?.location || "External",
    ip: chainEvents[0]?.ip || "0.0.0.0",
    timestamp: transaction.timestamp || new Date(),
    deltaMinutes: txDeltaMins,
    riskDelta: transferRiskDelta,
    runningScore,
    status: transferRiskDelta > 15 ? "CRITICAL" : "REVIEW",
  });

  const isFullSequence = hasNewDeviceLogin && hasPasswordChange && hasNewBeneficiary;

  // 3. Destination Account Graph Analysis
  const graphSignals = await analyzeDestinationGraph(
    transaction.destAccount,
    transaction.amount,
    transaction.txId
  );

  if (graphSignals.destRiskScore > 0) {
    runningScore = Math.min(100, runningScore + Math.round(graphSignals.destRiskScore * 0.7));
    explanations.push(`Mule Graph Threat: ${graphSignals.details}`);
  }

  // Final score clamping
  const compositeRiskScore = Math.min(100, Math.max(5, runningScore));

  // Determine Severity and Recommended Risk Action
  let severity = "LOW";
  let recommendedAction = "MONITOR";

  if (compositeRiskScore >= 85) {
    severity = "CRITICAL";
    recommendedAction = "ALERT";
  } else if (compositeRiskScore >= 70) {
    severity = "HIGH";
    recommendedAction = "HOLD";
  } else if (compositeRiskScore >= 40) {
    severity = "MEDIUM";
    recommendedAction = "VERIFY";
  } else {
    severity = "LOW";
    recommendedAction = "MONITOR";
  }

  return {
    compositeRiskScore,
    severity,
    recommendedAction,
    isFullSequence,
    chainEvents,
    graphSignals,
    baselineDeviation: {
      amountRatio: Number(amountRatio.toFixed(1)),
      isUnusualHour,
      isNewDevice: hasNewDeviceLogin,
      isNewBeneficiary: isTargetNewBeneficiary,
      typicalAmount: avgAmount,
      typicalHours: baseline.typicalHours || [],
      knownDevices: baseline.knownDevices || [],
    },
    explanations,
  };
}

module.exports = {
  correlateAtoIncident,
};
