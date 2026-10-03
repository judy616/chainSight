const User = require("../models/User");
const Event = require("../models/Event");
const Alert = require("../models/Alert");
const { analyzeDestinationGraph } = require("./graphEngine");

/**
 * Formats duration in milliseconds to human-readable string (e.g. "3m 42s" or "45s")
 */
function formatDuration(ms) {
  if (ms <= 0) return "0s";
  const totalSecs = Math.round(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  }
  return `${secs}s`;
}

/**
 * Normalizes event types to canonical ATO stages
 * Stage 1: LOGIN (NEW_DEVICE_LOGIN, TOR_LOGIN)
 * Stage 2: PASSWORD_CHANGE (PASSWORD_RESET)
 * Stage 3: BENEFICIARY_ADDED
 * Stage 4: TRANSFER_ATTEMPT
 */
function getEventStage(eventType) {
  switch (eventType) {
    case "LOGIN":
    case "NEW_DEVICE_LOGIN":
    case "TOR_LOGIN":
      return 1;
    case "PASSWORD_CHANGE":
    case "PASSWORD_RESET":
      return 2;
    case "BENEFICIARY_ADDED":
      return 3;
    case "TRANSFER_ATTEMPT":
      return 4;
    default:
      return 0;
  }
}

/**
 * Core Attack-Chain Correlation Engine
 * Correlates events for the same account inside a sliding 60-minute window.
 * Supports partial sequences, velocity detection, incremental scoring (25 -> 50 -> 75 -> 96),
 * and human-readable causal explainability.
 */
async function correlateAttackChain({
  userId,
  timeWindowMinutes = 60,
  eventsList = null,
  activeTransaction = null,
  referenceTime = null,
}) {
  let user = await User.findOne({ userId }).lean();
  if (!user) {
    // Graceful fallback for test or dynamic demo accounts
    user = {
      userId,
      name: "Account Holder",
      baseline: {
        avgTransferAmount: 350,
        maxNormalTransfer: 2500,
        typicalHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        knownDevices: ["Known Primary Device"],
        knownIps: ["192.0.2.1"],
        trustedBeneficiaries: [],
      },
    };
  }

  const baseline = user.baseline || {};
  const refDate = referenceTime ? new Date(referenceTime) : new Date();
  const windowMs = timeWindowMinutes * 60 * 1000;
  const cutoff = new Date(refDate.getTime() - windowMs);

  // 1. Gather events: from provided eventsList or query MongoDB
  let rawEvents = [];
  if (eventsList && Array.isArray(eventsList)) {
    rawEvents = [...eventsList];
  } else {
    rawEvents = await Event.find({
      userId,
      timestamp: { $gte: cutoff, $lte: refDate },
    })
      .sort({ timestamp: 1 })
      .lean();
  }

  // Filter within sliding window strictly
  let events = rawEvents
    .filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= cutoff.getTime() && t <= refDate.getTime();
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // If an active transaction is provided and not in events, append as TRANSFER_ATTEMPT
  if (activeTransaction) {
    const txTime = activeTransaction.timestamp ? new Date(activeTransaction.timestamp) : refDate;
    if (txTime >= cutoff && txTime <= refDate) {
      const alreadyHasTx = events.some(
        (e) => e.eventType === "TRANSFER_ATTEMPT" && (e.metadata?.txId === activeTransaction.txId || e.eventId === `EV-TX-${activeTransaction.txId}`)
      );
      if (!alreadyHasTx) {
        events.push({
          eventId: `EV-TX-${activeTransaction.txId || "CURRENT"}`,
          userId,
          eventType: "TRANSFER_ATTEMPT",
          deviceFingerprint: events[0]?.deviceFingerprint || "Active Session Device",
          ipAddress: events[0]?.ipAddress || "0.0.0.0",
          location: events[0]?.location || "External",
          timestamp: txTime,
          metadata: {
            amount: activeTransaction.amount,
            destAccount: activeTransaction.destAccount,
            destAccountName: activeTransaction.destAccountName,
            txId: activeTransaction.txId,
          },
        });
        events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      }
    }
  }

  // 2. State & Sequence Tracking
  const chainEvents = [];
  const explanations = [];
  const velocitySignals = [];
  const completedStages = new Set();

  let runningScore = 0;
  let firstLoginEvent = null;
  let lastUntrustedLogin = null;
  let lastPasswordChange = null;
  let lastBeneficiaryAdd = null;

  // Process chronological event stream
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const evTime = new Date(ev.timestamp);
    const stage = getEventStage(ev.eventType);

    let riskDelta = 0;
    let ruleFired = "NOMINAL-LOG";
    let explanation = "";
    let label = "";
    let velocityMsg = null;

    // Time delta from first session login
    if (!firstLoginEvent && stage === 1) {
      firstLoginEvent = ev;
    }
    const sessionOrigin = firstLoginEvent ? new Date(firstLoginEvent.timestamp) : evTime;
    const deltaMsFromOrigin = Math.max(0, evTime - sessionOrigin);
    const deltaMinutes = Number((deltaMsFromOrigin / (1000 * 60)).toFixed(1));
    const formattedDelta = deltaMinutes === 0 ? "00:00" : `+${formatDuration(deltaMsFromOrigin)}`;

    // STAGE 1: LOGIN / NEW DEVICE / TOR
    if (stage === 1) {
      const isUntrusted =
        ev.isNewDevice ||
        ev.isSuspiciousIp ||
        ev.eventType === "NEW_DEVICE_LOGIN" ||
        ev.eventType === "TOR_LOGIN" ||
        ev.metadata?.isUntrusted ||
        (ev.ipAddress && ev.ipAddress.startsWith("185.220.")) || // Tor exit node range
        (baseline.knownDevices && ev.deviceFingerprint && !baseline.knownDevices.some(d => d.includes(ev.deviceFingerprint) || ev.deviceFingerprint.includes(d)));

      if (isUntrusted) {
        lastUntrustedLogin = ev;
        riskDelta = 25;
        ruleFired = "ATO-CHAIN-01: Untrusted Device Inception";
        label = `Untrusted Device Login (${ev.deviceFingerprint || "Tor Exit Node"})`;
        explanation = `Untrusted Login: Session initiated from an unrecognized device (${ev.deviceFingerprint || "Unknown"}) at ${ev.location || "unusual location"} [IP: ${ev.ipAddress || "Unknown"}].`;
        explanations.push(explanation);
      } else {
        riskDelta = 0;
        ruleFired = "NOMINAL-01: Authorized Login";
        label = `Authorized Login (${ev.deviceFingerprint || "Known Device"})`;
        explanation = `Routine session initiated from habitual customer device (${ev.deviceFingerprint || "Authorized"}).`;
      }
      completedStages.add(1);
    }

    // STAGE 2: CREDENTIAL / PASSWORD RESET
    else if (stage === 2) {
      lastPasswordChange = ev;
      completedStages.add(2);

      // Velocity Check from previous untrusted login
      let minsSinceLogin = 999;
      let diffMs = 0;
      if (lastUntrustedLogin) {
        diffMs = evTime - new Date(lastUntrustedLogin.timestamp);
        minsSinceLogin = diffMs / (1000 * 60);
      }

      if (lastUntrustedLogin && minsSinceLogin <= 5) {
        // High-velocity attack indicator (< 5 minutes)
        riskDelta = 25;
        ruleFired = "ATO-VEL-01: High-Velocity Credential Reset";
        const durationStr = formatDuration(diffMs);
        velocityMsg = `Password reset occurred ${durationStr} after an untrusted-device login.`;
        label = `Rapid Password Reset (${durationStr} post-login)`;
        explanation = `High-Velocity Credential Modification: ${velocityMsg} Velocity threshold (<5m) violated.`;
        velocitySignals.push({
          rule: "ATO-VEL-01",
          deltaMinutes: Number(minsSinceLogin.toFixed(1)),
          formattedDelta: durationStr,
          reason: velocityMsg,
        });
        explanations.push(explanation);
      } else if (lastUntrustedLogin && minsSinceLogin <= 60) {
        // Correlated reset within 60m window
        riskDelta = 25;
        ruleFired = "ATO-CHAIN-02: Correlated Password Reset";
        const durationStr = formatDuration(diffMs);
        label = `Password Reset (${durationStr} post-login)`;
        explanation = `Credential Modification: Password changed ${durationStr} after untrusted login session.`;
        explanations.push(explanation);
      } else {
        // Standalone or benign reset
        riskDelta = 10;
        ruleFired = "SEC-PWD-01: Standalone Credential Modification";
        label = `Password Modification`;
        explanation = `Password credential change recorded in active session.`;
        explanations.push(explanation);
      }
    }

    // STAGE 3: UNVERIFIED BENEFICIARY ADDED
    else if (stage === 3) {
      lastBeneficiaryAdd = ev;
      completedStages.add(3);

      const targetAccount = ev.metadata?.beneficiaryAccount || "";
      const targetName = ev.metadata?.beneficiaryName || "External Beneficiary";
      const isTrusted = baseline.trustedBeneficiaries?.includes(targetAccount);

      // Velocity Check from password change
      let minsSincePwd = 999;
      let diffMsFromPwd = 0;
      if (lastPasswordChange) {
        diffMsFromPwd = evTime - new Date(lastPasswordChange.timestamp);
        minsSincePwd = diffMsFromPwd / (1000 * 60);
      }

      if (!isTrusted) {
        riskDelta = 25;
        if (lastPasswordChange && minsSincePwd <= 15) {
          ruleFired = "ATO-VEL-02: Rapid Beneficiary Onboarding";
          const durationStr = formatDuration(diffMsFromPwd);
          velocityMsg = `Unverified beneficiary '${targetName}' added ${durationStr} post-password reset.`;
          label = `Immediate Payee Added (${targetName})`;
          explanation = `Immediate Payee Addition: Added unverified beneficiary '${targetName}' just ${durationStr} following password reset.`;
          velocitySignals.push({
            rule: "ATO-VEL-02",
            deltaMinutes: Number(minsSincePwd.toFixed(1)),
            formattedDelta: durationStr,
            reason: velocityMsg,
          });
        } else {
          ruleFired = "ATO-CHAIN-03: Unverified Beneficiary Registered";
          label = `New Beneficiary Added (${targetName})`;
          explanation = `Unverified Destination Added: External beneficiary '${targetName}' registered on account.`;
        }
        explanations.push(explanation);
      } else {
        riskDelta = 0;
        ruleFired = "NOMINAL-03: Known Payee Verified";
        label = `Verified Beneficiary Added (${targetName})`;
        explanation = `Payee '${targetName}' is present on customer trusted whitelist.`;
      }
    }

    // STAGE 4: TRANSFER ATTEMPT
    else if (stage === 4) {
      completedStages.add(4);

      const txAmount = ev.metadata?.amount || (activeTransaction ? activeTransaction.amount : 0);
      const destName = ev.metadata?.destAccountName || (activeTransaction ? activeTransaction.destAccountName : "External Payee");
      const destAccount = ev.metadata?.destAccount || (activeTransaction ? activeTransaction.destAccount : "");

      const isSequencePresent = completedStages.has(1) && (completedStages.has(2) || completedStages.has(3));
      const avgTransfer = baseline.avgTransferAmount || 350;
      const isHighAmount = txAmount >= avgTransfer * 3 || txAmount >= 5000;
      const isUnverifiedDest = !baseline.trustedBeneficiaries?.includes(destAccount);

      if (isSequencePresent && (isHighAmount || isUnverifiedDest)) {
        // High-value transfer completes the 4-stage ATO chain -> adds 21 to reach exactly 96
        riskDelta = 21;
        ruleFired = "ATO-CHAIN-04: High-Value Exfiltration Attempt";
        label = `Transfer Attempt ($${Number(txAmount).toLocaleString()})`;
        explanation = `Exfiltration Attempt: Outbound wire ($${Number(txAmount).toLocaleString()}) attempted to unverified recipient '${destName}' following credential reset & payee onboarding.`;
        explanations.push(explanation);
      } else if (isHighAmount) {
        riskDelta = 15;
        ruleFired = "DEV-AMT-01: Baseline Amount Outlier";
        label = `Unusual Transfer Amount ($${Number(txAmount).toLocaleString()})`;
        explanation = `Substantial Amount Spike: Transfer ($${Number(txAmount).toLocaleString()}) deviates from 30-day baseline average ($${avgTransfer}).`;
        explanations.push(explanation);
      } else {
        riskDelta = 7;
        ruleFired = "NOMINAL-04: Routine Transfer";
        label = `Routine Payment ($${Number(txAmount).toLocaleString()})`;
        explanation = `Transfer amount ($${Number(txAmount).toLocaleString()}) aligns with historical customer profile.`;
      }
    }

    // Accumulate score (capped at 96 for prototype attack sequence)
    runningScore = Math.min(96, runningScore + riskDelta);

    chainEvents.push({
      eventId: ev.eventId || `EV-AUTO-${i + 1}`,
      eventType: ev.eventType,
      stageNumber: stage,
      label: label || ev.eventType,
      device: ev.deviceFingerprint || "Unknown Device",
      location: ev.location || "Unknown Location",
      ip: ev.ipAddress || "0.0.0.0",
      timestamp: evTime,
      deltaMinutes,
      formattedDelta,
      riskDelta,
      runningScore,
      ruleFired,
      explanation,
      status: riskDelta >= 20 ? "CRITICAL" : riskDelta > 0 ? "SUSPICIOUS" : "NORMAL",
    });
  }

  // 3. Chain State Summary
  const completedStagesList = Array.from(completedStages).sort((a, b) => a - b);
  const activeStage = completedStagesList.length > 0 ? completedStagesList[completedStagesList.length - 1] : 0;
  const isFullSequence = completedStages.has(1) && completedStages.has(2) && completedStages.has(3) && completedStages.has(4);

  // Determine Severity and Recommended Policy Action
  let severity = "LOW";
  let recommendedAction = "MONITOR";

  if (runningScore >= 85) {
    severity = "CRITICAL";
    recommendedAction = "ALERT";
  } else if (runningScore >= 70) {
    severity = "HIGH";
    recommendedAction = "HOLD";
  } else if (runningScore >= 40) {
    severity = "MEDIUM";
    recommendedAction = "VERIFY";
  } else {
    severity = "LOW";
    recommendedAction = "MONITOR";
  }

  return {
    userId,
    userName: user.name,
    timeWindowMinutes,
    currentStage: activeStage,
    completedStages: completedStagesList,
    isFullSequence,
    cumulativeRiskScore: runningScore,
    severity,
    recommendedAction,
    velocitySignals,
    chainEvents,
    explanations,
  };
}

/**
 * High-level incident correlator combining the Attack Chain Engine with
 * baseline deviations and destination graph signals for transactions.
 */
async function correlateAtoIncident({ userId, transaction, timeWindowMinutes = 60 }) {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // 1. Run core attack chain engine
  const chainResult = await correlateAttackChain({
    userId,
    timeWindowMinutes,
    activeTransaction: transaction,
  });

  const baseline = user.baseline || {};
  let compositeScore = chainResult.cumulativeRiskScore;
  const explanations = [...chainResult.explanations];

  // 2. Behavioral Baseline Deviations for Transfer
  const avgAmount = baseline.avgTransferAmount || 350;
  const amountRatio = transaction.amount ? Number((transaction.amount / avgAmount).toFixed(1)) : 1;
  const txHour = new Date(transaction.timestamp || Date.now()).getHours();
  const isUnusualHour = Array.isArray(baseline.typicalHours) && !baseline.typicalHours.includes(txHour);
  const isNewBeneficiary = !baseline.trustedBeneficiaries?.includes(transaction.destAccount);

  if (isUnusualHour) {
    compositeScore = Math.min(100, compositeScore + 5);
    explanations.push(`Temporal Anomaly: Transaction submitted at ${txHour}:00 (outside typical activity window).`);
  }

  // 3. Destination Account Graph Analysis
  const graphSignals = await analyzeDestinationGraph(
    transaction.destAccount,
    transaction.amount,
    transaction.txId
  );

  if (graphSignals.destRiskScore > 0) {
    compositeScore = Math.min(100, compositeScore + Math.round(graphSignals.destRiskScore * 0.5));
    explanations.push(`Mule Graph Threat: ${graphSignals.details}`);
  }

  // Policy recommendation based on blended composite score
  let severity = "LOW";
  let recommendedAction = "MONITOR";

  if (compositeScore >= 85) {
    severity = "CRITICAL";
    recommendedAction = "ALERT";
  } else if (compositeScore >= 70) {
    severity = "HIGH";
    recommendedAction = "HOLD";
  } else if (compositeScore >= 40) {
    severity = "MEDIUM";
    recommendedAction = "VERIFY";
  } else {
    severity = "LOW";
    recommendedAction = "MONITOR";
  }

  return {
    compositeRiskScore: compositeScore,
    severity,
    recommendedAction,
    isFullSequence: chainResult.isFullSequence,
    chainEvents: chainResult.chainEvents,
    velocitySignals: chainResult.velocitySignals,
    graphSignals,
    baselineDeviation: {
      amountRatio,
      isUnusualHour,
      isNewDevice: chainResult.completedStages.includes(1),
      isNewBeneficiary,
      typicalAmount: avgAmount,
      typicalHours: baseline.typicalHours || [],
      knownDevices: baseline.knownDevices || [],
    },
    explanations,
  };
}

module.exports = {
  correlateAttackChain,
  correlateAtoIncident,
  getEventStage,
  formatDuration,
};
