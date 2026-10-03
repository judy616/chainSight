const mongoose = require("mongoose");
const { correlateAttackChain } = require("./services/correlator");

async function runTests() {
  console.log("=================================================");
  console.log("   CHAINSIGHT FEATURE 1 ACCEPTANCE TEST SUITE    ");
  console.log("=================================================\n");

  await mongoose.connect("mongodb://127.0.0.1:27017/chainsight");
  console.log("Connected to MongoDB for tests.\n");

  let totalPassed = 0;
  let totalTests = 0;

  function assert(condition, testName, details = "") {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      if (details) console.log(`   ↳ ${details}`);
      totalPassed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (details) console.error(`   ↳ ${details}`);
    }
  }

  const now = Date.now();

  // -------------------------------------------------------------
  // TEST 1: TARGET 4-STAGE ATTACK SEQUENCE (25 -> 50 -> 75 -> 96)
  // -------------------------------------------------------------
  console.log("--- TEST 1: Full 4-Stage Attack Sequence within 60m ---");
  const t0 = new Date(now - 10 * 60 * 1000); // 00:00 (10 mins ago)
  const t1 = new Date(t0.getTime() + 3 * 60 * 1000); // +3m
  const t2 = new Date(t1.getTime() + 2 * 60 * 1000); // +5m (+2m from pwd)
  const t3 = new Date(t2.getTime() + 4 * 60 * 1000); // +9m (+4m from payee)

  const sc1Events = [
    {
      eventId: "TEST-EV-01",
      userId: "USR-8491",
      eventType: "NEW_DEVICE_LOGIN",
      deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
      isNewDevice: true,
      ipAddress: "185.220.101.5",
      isSuspiciousIp: true,
      location: "St. Petersburg, Russia",
      timestamp: t0,
      metadata: { isUntrusted: true },
    },
    {
      eventId: "TEST-EV-02",
      userId: "USR-8491",
      eventType: "PASSWORD_RESET",
      deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
      isNewDevice: true,
      ipAddress: "185.220.101.5",
      location: "St. Petersburg, Russia",
      timestamp: t1,
      metadata: { method: "SMS_OTP_BYPASS" },
    },
    {
      eventId: "TEST-EV-03",
      userId: "USR-8491",
      eventType: "BENEFICIARY_ADDED",
      deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
      isNewDevice: true,
      ipAddress: "185.220.101.5",
      location: "St. Petersburg, Russia",
      timestamp: t2,
      metadata: {
        beneficiaryAccount: "ACC-MULE-902",
        beneficiaryName: "Apex Global Holdings LLC (Mule)",
      },
    },
    {
      eventId: "TEST-EV-04",
      userId: "USR-8491",
      eventType: "TRANSFER_ATTEMPT",
      deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
      isNewDevice: true,
      ipAddress: "185.220.101.5",
      location: "St. Petersburg, Russia",
      timestamp: t3,
      metadata: {
        amount: 24500,
        destAccount: "ACC-MULE-902",
        destAccountName: "Apex Global Holdings LLC (Mule)",
      },
    },
  ];

  // Stage 1 check
  const res1 = await correlateAttackChain({
    userId: "USR-8491",
    eventsList: sc1Events.slice(0, 1),
    referenceTime: t0,
  });
  assert(res1.cumulativeRiskScore === 25, "Stage 1 Score is exactly 25", `Score: ${res1.cumulativeRiskScore}`);

  // Stage 2 check
  const res2 = await correlateAttackChain({
    userId: "USR-8491",
    eventsList: sc1Events.slice(0, 2),
    referenceTime: t1,
  });
  assert(res2.cumulativeRiskScore === 50, "Stage 2 Score is exactly 50", `Score: ${res2.cumulativeRiskScore}`);
  assert(
    res2.velocitySignals.some((v) => v.rule === "ATO-VEL-01"),
    "Velocity Rule ATO-VEL-01 fired (<5m)",
    `Velocity alert: ${res2.velocitySignals[0]?.reason}`
  );

  // Stage 3 check
  const res3 = await correlateAttackChain({
    userId: "USR-8491",
    eventsList: sc1Events.slice(0, 3),
    referenceTime: t2,
  });
  assert(res3.cumulativeRiskScore === 75, "Stage 3 Score is exactly 75", `Score: ${res3.cumulativeRiskScore}`);

  // Stage 4 check
  const res4 = await correlateAttackChain({
    userId: "USR-8491",
    eventsList: sc1Events.slice(0, 4),
    referenceTime: t3,
  });
  assert(res4.cumulativeRiskScore === 96, "Stage 4 Score is exactly 96 (Maximum prototype sequence score)", `Score: ${res4.cumulativeRiskScore}`);
  assert(res4.isFullSequence === true, "Full attack sequence recognized", `Completed stages: ${res4.completedStages.join(" -> ")}`);
  assert(res4.severity === "CRITICAL", "Severity elevated to CRITICAL", `Severity: ${res4.severity}`);
  assert(res4.recommendedAction === "ALERT", "Policy Action is ALERT & BLOCK", `Action: ${res4.recommendedAction}`);
  assert(res4.explanations.length >= 4, "Complete chronological explanations returned", `Count: ${res4.explanations.length}`);

  // -------------------------------------------------------------
  // TEST 2: NORMAL LOGIN + NORMAL TRANSFER
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Normal Login + Routine Transfer ---");
  const normEvents = [
    {
      eventId: "NORM-EV-01",
      userId: "USR-1001",
      eventType: "LOGIN",
      deviceFingerprint: "iPhone 14 (iOS 17.2 / Mobile Banking)",
      isNewDevice: false,
      ipAddress: "192.0.2.100",
      location: "Denver, CO, US",
      timestamp: new Date(now - 8 * 60 * 1000),
      metadata: {},
    },
    {
      eventId: "NORM-EV-02",
      userId: "USR-1001",
      eventType: "TRANSFER_ATTEMPT",
      deviceFingerprint: "iPhone 14 (iOS 17.2 / Mobile Banking)",
      isNewDevice: false,
      ipAddress: "192.0.2.100",
      location: "Denver, CO, US",
      timestamp: new Date(now - 1 * 60 * 1000),
      metadata: {
        amount: 115.5,
        destAccount: "ACC-METER-88",
        destAccountName: "Denver Water & Utility",
      },
    },
  ];

  const normRes = await correlateAttackChain({
    userId: "USR-1001",
    eventsList: normEvents,
    referenceTime: new Date(now),
  });
  assert(normRes.cumulativeRiskScore <= 15, "Routine activity receives benign low score", `Score: ${normRes.cumulativeRiskScore}`);
  assert(normRes.severity === "LOW", "Routine activity severity is LOW", `Severity: ${normRes.severity}`);
  assert(normRes.recommendedAction === "MONITOR", "Routine activity policy is MONITOR", `Action: ${normRes.recommendedAction}`);

  // -------------------------------------------------------------
  // TEST 3: INCOMPLETE / PARTIAL ATTACK SEQUENCE
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: Partial Attack Sequence (New Device + Password Reset) ---");
  const partialEvents = sc1Events.slice(0, 2);
  const partialRes = await correlateAttackChain({
    userId: "USR-8491",
    eventsList: partialEvents,
    referenceTime: t1,
  });
  assert(partialRes.currentStage === 2, "Current active stage is recognized as Phase 2", `Stage: ${partialRes.currentStage}`);
  assert(partialRes.cumulativeRiskScore === 50, "Partial sequence produces elevated risk score (50)", `Score: ${partialRes.cumulativeRiskScore}`);
  assert(partialRes.severity === "MEDIUM", "Partial sequence severity is MEDIUM", `Severity: ${partialRes.severity}`);
  assert(partialRes.recommendedAction === "VERIFY", "Partial sequence triggers Step-Up MFA policy", `Action: ${partialRes.recommendedAction}`);

  // -------------------------------------------------------------
  // TEST 4: SLIDING 60-MINUTE WINDOW BOUNDARY
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Sliding 60-Minute Window Boundary ---");
  const oldLoginTime = new Date(now - 75 * 60 * 1000); // 75 minutes ago (EXPIRED)
  const windowEvents = [
    {
      eventId: "OLD-EV-01",
      userId: "USR-8491",
      eventType: "NEW_DEVICE_LOGIN",
      isNewDevice: true,
      ipAddress: "185.220.101.5",
      timestamp: oldLoginTime,
    },
    {
      eventId: "RECENT-EV-02",
      userId: "USR-8491",
      eventType: "PASSWORD_CHANGE",
      timestamp: new Date(now - 5 * 60 * 1000), // 5 minutes ago (INSIDE WINDOW)
    },
  ];

  const windowRes = await correlateAttackChain({
    userId: "USR-8491",
    eventsList: windowEvents,
    timeWindowMinutes: 60,
    referenceTime: new Date(now),
  });
  assert(
    windowRes.chainEvents.length === 1,
    "Event older than 60m is filtered out from active correlation",
    `Events in window: ${windowRes.chainEvents.length}`
  );
  assert(
    windowRes.chainEvents[0].eventId === "RECENT-EV-02",
    "Only recent event within sliding 60m window was evaluated",
    `Event: ${windowRes.chainEvents[0]?.eventId}`
  );

  // -------------------------------------------------------------
  // TEST 5: SLOW SEQUENCE VS HIGH-VELOCITY SEQUENCE
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Slow Sequence vs High-Velocity Sequence ---");
  const slowEvents = [
    {
      eventId: "SLOW-EV-01",
      userId: "USR-8491",
      eventType: "NEW_DEVICE_LOGIN",
      isNewDevice: true,
      timestamp: new Date(now - 45 * 60 * 1000), // 45m ago
    },
    {
      eventId: "SLOW-EV-02",
      userId: "USR-8491",
      eventType: "PASSWORD_RESET",
      timestamp: new Date(now - 10 * 60 * 1000), // 35m later (slow, > 5m)
    },
  ];

  const slowRes = await correlateAttackChain({
    userId: "USR-8491",
    eventsList: slowEvents,
    referenceTime: new Date(now),
  });
  const hasVelocityWarning = slowRes.velocitySignals.some((v) => v.rule === "ATO-VEL-01");
  assert(!hasVelocityWarning, "Slow sequence (>5m delta) does not trigger velocity alert", "No velocity alert fired as expected");

  console.log("\n=================================================");
  console.log(`SUMMARY: ${totalPassed} of ${totalTests} TESTS PASSED (${Math.round((totalPassed / totalTests) * 100)}%)`);
  console.log("=================================================\n");

  await mongoose.disconnect();
  process.exit(totalPassed === totalTests ? 0 : 1);
}

runTests().catch((err) => {
  console.error("FATAL ERROR in tests:", err);
  process.exit(1);
});
