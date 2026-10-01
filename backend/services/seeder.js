const User = require("../models/User");
const Event = require("../models/Event");
const Transaction = require("../models/Transaction");
const Alert = require("../models/Alert");
const { correlateAtoIncident } = require("./correlator");

async function seedDatabase(force = false) {
  const existingAlerts = await Alert.countDocuments();
  if (existingAlerts > 0 && !force) {
    console.log("Database already has data. Skipping seed (pass force=true to re-seed).");
    return;
  }

  console.log("Seeding fresh ChainSight database...");

  // Clear existing
  await User.deleteMany({});
  await Event.deleteMany({});
  await Transaction.deleteMany({});
  await Alert.deleteMany({});

  // 1. Create Users
  const users = [
    {
      userId: "USR-8491",
      name: "Eleanor Vance",
      email: "eleanor.vance@vancetech.io",
      accountNumber: "ACC-849102",
      accountType: "PREMIER_CHECKING",
      currentBalance: 98450.0,
      baseline: {
        avgTransferAmount: 350,
        maxNormalTransfer: 2500,
        typicalHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        knownDevices: ["MacBook Pro 16\" (macOS Sonoma / Chrome 124)", "iPhone 15 Pro (iOS 17.4 / Mobile Banking)"],
        knownIps: ["192.0.2.45", "198.51.100.12"],
        knownLocations: ["Seattle, WA, US", "Bellevue, WA, US"],
        trustedBeneficiaries: ["ACC-849900", "ACC-712399"],
      },
    },
    {
      userId: "USR-3092",
      name: "Marcus Sterling",
      email: "marcus@sterlinglogistics.com",
      accountNumber: "ACC-309211",
      accountType: "BUSINESS_CHECKING",
      currentBalance: 142000.0,
      baseline: {
        avgTransferAmount: 1200,
        maxNormalTransfer: 6000,
        typicalHours: [8, 9, 10, 11, 12, 13, 14, 15, 16],
        knownDevices: ["Lenovo ThinkPad X1 (Windows 11 / Edge)", "Samsung Galaxy S24 (Android 14)"],
        knownIps: ["203.0.113.88"],
        knownLocations: ["Chicago, IL, US"],
        trustedBeneficiaries: ["ACC-VENDOR-1", "ACC-PAYROLL-9"],
      },
    },
    {
      userId: "USR-5510",
      name: "Sophia Rodriguez",
      email: "sophia.rodriguez@designhub.co",
      accountNumber: "ACC-551088",
      accountType: "SAVINGS",
      currentBalance: 34500.0,
      baseline: {
        avgTransferAmount: 180,
        maxNormalTransfer: 800,
        typicalHours: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        knownDevices: ["iPad Pro 12.9\" (iPadOS 17 / Safari)"],
        knownIps: ["198.51.100.77"],
        knownLocations: ["Austin, TX, US"],
        trustedBeneficiaries: ["ACC-RENT-99", "ACC-UTILITY-44"],
      },
    },
    {
      userId: "USR-1001",
      name: "David Miller",
      email: "david.miller@gmail.com",
      accountNumber: "ACC-100123",
      accountType: "CHECKING",
      currentBalance: 8200.0,
      baseline: {
        avgTransferAmount: 95,
        maxNormalTransfer: 450,
        typicalHours: [7, 8, 9, 12, 13, 18, 19, 20, 21],
        knownDevices: ["iPhone 14 (iOS 17.2 / Mobile Banking)"],
        knownIps: ["192.0.2.100"],
        knownLocations: ["Denver, CO, US"],
        trustedBeneficiaries: ["ACC-METER-88", "ACC-GROCERY-12"],
      },
    },
  ];

  await User.insertMany(users);

  // 2. Pre-seed Network Mule & Pass-Through Transactions
  const now = new Date();
  const pastMinutes = (m) => new Date(now.getTime() - m * 60 * 1000);

  const muleNetworkTxs = [
    {
      txId: "TX-IN-01",
      sourceAccount: "ACC-VICTIM-1",
      sourceUserName: "Alice Cooper",
      destAccount: "ACC-MULE-902",
      destAccountName: "Apex Global Holdings LLC (Mule)",
      amount: 14200,
      type: "WIRE",
      timestamp: pastMinutes(28),
      status: "APPROVED",
      networkPattern: "FAN_IN",
      riskScore: 78,
    },
    {
      txId: "TX-IN-02",
      sourceAccount: "ACC-VICTIM-2",
      sourceUserName: "Bob Evans",
      destAccount: "ACC-MULE-902",
      destAccountName: "Apex Global Holdings LLC (Mule)",
      amount: 18500,
      type: "WIRE",
      timestamp: pastMinutes(22),
      status: "APPROVED",
      networkPattern: "FAN_IN",
      riskScore: 82,
    },
    {
      txId: "TX-OUT-SWEEP",
      sourceAccount: "ACC-MULE-902",
      sourceUserName: "Apex Global Holdings LLC (Mule)",
      destAccount: "ACC-OFFSHORE-99",
      destAccountName: "Cold Wallet Settlement / Offshore Exch",
      amount: 31000,
      type: "CASH_OUT",
      timestamp: pastMinutes(14),
      status: "APPROVED",
      networkPattern: "RAPID_PASS_THROUGH",
      riskScore: 94,
    },
    {
      txId: "TX-MULE-A",
      sourceAccount: "ACC-REG-101",
      sourceUserName: "Kevin Park",
      destAccount: "ACC-MULE-441",
      destAccountName: "Digital Settlement Corp",
      amount: 4950,
      type: "TRANSFER",
      timestamp: pastMinutes(45),
      status: "APPROVED",
      networkPattern: "FAN_IN",
      riskScore: 74,
    },
    {
      txId: "TX-MULE-B",
      sourceAccount: "ACC-REG-102",
      sourceUserName: "Lori Grimes",
      destAccount: "ACC-MULE-441",
      destAccountName: "Digital Settlement Corp",
      amount: 4800,
      type: "TRANSFER",
      timestamp: pastMinutes(35),
      status: "APPROVED",
      networkPattern: "FAN_IN",
      riskScore: 76,
    },
    {
      txId: "TX-MULE-C",
      sourceAccount: "ACC-REG-103",
      sourceUserName: "Ray Henderson",
      destAccount: "ACC-MULE-441",
      destAccountName: "Digital Settlement Corp",
      amount: 4990,
      type: "TRANSFER",
      timestamp: pastMinutes(25),
      status: "APPROVED",
      networkPattern: "FAN_IN",
      riskScore: 80,
    },
    {
      txId: "TX-CYC-01",
      sourceAccount: "ACC-CYC-1",
      sourceUserName: "Smurf Shell Alpha",
      destAccount: "ACC-CYC-2",
      destAccountName: "Smurf Shell Beta",
      amount: 8900,
      type: "TRANSFER",
      timestamp: pastMinutes(60),
      status: "APPROVED",
      networkPattern: "CIRCULAR",
      riskScore: 88,
    },
    {
      txId: "TX-CYC-02",
      sourceAccount: "ACC-CYC-2",
      sourceUserName: "Smurf Shell Beta",
      destAccount: "ACC-CYC-3",
      destAccountName: "Smurf Shell Gamma",
      amount: 8750,
      type: "TRANSFER",
      timestamp: pastMinutes(40),
      status: "APPROVED",
      networkPattern: "CIRCULAR",
      riskScore: 89,
    },
    {
      txId: "TX-CYC-03",
      sourceAccount: "ACC-CYC-3",
      sourceUserName: "Smurf Shell Gamma",
      destAccount: "ACC-CYC-1",
      destAccountName: "Smurf Shell Alpha",
      amount: 8600,
      type: "TRANSFER",
      timestamp: pastMinutes(20),
      status: "APPROVED",
      networkPattern: "CIRCULAR",
      riskScore: 92,
    },
  ];

  await Transaction.insertMany(muleNetworkTxs);

  // 3. Scenario 1: Classic ATO Heist on Eleanor Vance (USR-8491)
  const sc1Events = [
    {
      eventId: "EV-8491-01",
      userId: "USR-8491",
      eventType: "LOGIN",
      deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
      isNewDevice: true,
      ipAddress: "185.220.101.5",
      isSuspiciousIp: true,
      location: "St. Petersburg, Russia",
      isSuspiciousLocation: true,
      timestamp: pastMinutes(32),
      metadata: { userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0" },
      riskContribution: 25,
      status: "SUSPICIOUS",
    },
    {
      eventId: "EV-8491-02",
      userId: "USR-8491",
      eventType: "PASSWORD_CHANGE",
      deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
      isNewDevice: true,
      ipAddress: "185.220.101.5",
      isSuspiciousIp: true,
      location: "St. Petersburg, Russia",
      timestamp: pastMinutes(27),
      metadata: { method: "SMS_OTP_BYPASS_ATTEMPT" },
      riskContribution: 25,
      status: "SUSPICIOUS",
    },
    {
      eventId: "EV-8491-03",
      userId: "USR-8491",
      eventType: "BENEFICIARY_ADDED",
      deviceFingerprint: "Unknown Linux / Tor Browser 13.0",
      isNewDevice: true,
      ipAddress: "185.220.101.5",
      location: "St. Petersburg, Russia",
      timestamp: pastMinutes(21),
      metadata: {
        beneficiaryAccount: "ACC-MULE-902",
        beneficiaryName: "Apex Global Holdings LLC (Mule)",
        bankRouting: "021000021",
      },
      riskContribution: 25,
      status: "SUSPICIOUS",
    },
  ];

  await Event.insertMany(sc1Events);

  const sc1Tx = {
    txId: "TX-8491-99",
    sourceAccount: "ACC-849102",
    sourceUserName: "Eleanor Vance",
    destAccount: "ACC-MULE-902",
    destAccountName: "Apex Global Holdings LLC (Mule)",
    amount: 24500,
    currency: "USD",
    type: "WIRE",
    timestamp: pastMinutes(10),
    status: "HELD",
    riskScore: 96,
    riskLevel: "CRITICAL",
    recommendedAction: "ALERT",
    networkPattern: "RAPID_PASS_THROUGH",
  };

  await Transaction.create(sc1Tx);

  const sc1Correlation = await correlateAtoIncident({
    userId: "USR-8491",
    transaction: sc1Tx,
    timeWindowMinutes: 60,
  });

  await Alert.create({
    alertId: "ALT-2026-001",
    userId: "USR-8491",
    userName: "Eleanor Vance",
    sourceAccount: "ACC-849102",
    targetTransactionId: sc1Tx.txId,
    targetAmount: sc1Tx.amount,
    destAccount: sc1Tx.destAccount,
    destAccountName: sc1Tx.destAccountName,
    detectedAt: pastMinutes(10),
    compositeRiskScore: sc1Correlation.compositeRiskScore,
    severity: sc1Correlation.severity,
    recommendedAction: sc1Correlation.recommendedAction,
    status: "NEW",
    attackChain: {
      sequenceDetected: sc1Correlation.isFullSequence,
      timeWindowMinutes: 22,
      events: sc1Correlation.chainEvents,
    },
    graphSignals: sc1Correlation.graphSignals,
    baselineDeviation: sc1Correlation.baselineDeviation,
    explanations: sc1Correlation.explanations,
    analystNotes: [
      {
        action: "AUTO_HOLD",
        note: "System policy automated hold engaged (Risk score 96 >= 85). Pending SecOps review.",
        timestamp: pastMinutes(9),
        author: "ChainSight Engine",
      },
    ],
  });

  // 4. Scenario 2: High-Velocity Mule Ring Target (Marcus Sterling - USR-3092)
  const sc2Events = [
    {
      eventId: "EV-3092-01",
      userId: "USR-3092",
      eventType: "LOGIN",
      deviceFingerprint: "Unknown Android Emulator / Pixel 7",
      isNewDevice: true,
      ipAddress: "45.154.255.80",
      isSuspiciousIp: true,
      location: "Frankfurt, Germany",
      timestamp: pastMinutes(50),
      metadata: {},
      riskContribution: 25,
      status: "SUSPICIOUS",
    },
    {
      eventId: "EV-3092-02",
      userId: "USR-3092",
      eventType: "BENEFICIARY_ADDED",
      deviceFingerprint: "Unknown Android Emulator / Pixel 7",
      isNewDevice: true,
      ipAddress: "45.154.255.80",
      location: "Frankfurt, Germany",
      timestamp: pastMinutes(35),
      metadata: { beneficiaryAccount: "ACC-MULE-441", beneficiaryName: "Digital Settlement Corp" },
      riskContribution: 20,
      status: "SUSPICIOUS",
    },
  ];

  await Event.insertMany(sc2Events);

  const sc2Tx = {
    txId: "TX-3092-88",
    sourceAccount: "ACC-309211",
    sourceUserName: "Marcus Sterling",
    destAccount: "ACC-MULE-441",
    destAccountName: "Digital Settlement Corp",
    amount: 19800,
    currency: "USD",
    type: "TRANSFER",
    timestamp: pastMinutes(15),
    status: "VERIFY_REQUIRED",
    riskScore: 84,
    riskLevel: "HIGH",
    recommendedAction: "HOLD",
    networkPattern: "FAN_IN",
  };
  await Transaction.create(sc2Tx);

  const sc2Correlation = await correlateAtoIncident({
    userId: "USR-3092",
    transaction: sc2Tx,
    timeWindowMinutes: 60,
  });

  await Alert.create({
    alertId: "ALT-2026-002",
    userId: "USR-3092",
    userName: "Marcus Sterling",
    sourceAccount: "ACC-309211",
    targetTransactionId: sc2Tx.txId,
    targetAmount: sc2Tx.amount,
    destAccount: sc2Tx.destAccount,
    destAccountName: sc2Tx.destAccountName,
    detectedAt: pastMinutes(15),
    compositeRiskScore: sc2Correlation.compositeRiskScore,
    severity: sc2Correlation.severity,
    recommendedAction: sc2Correlation.recommendedAction,
    status: "UNDER_REVIEW",
    attackChain: {
      sequenceDetected: sc2Correlation.isFullSequence,
      timeWindowMinutes: 35,
      events: sc2Correlation.chainEvents,
    },
    graphSignals: sc2Correlation.graphSignals,
    baselineDeviation: sc2Correlation.baselineDeviation,
    explanations: sc2Correlation.explanations,
    analystNotes: [],
  });

  // 5. Scenario 3: Circular Layering Loop (Sophia Rodriguez - USR-5510)
  const sc3Events = [
    {
      eventId: "EV-5510-01",
      userId: "USR-5510",
      eventType: "LOGIN",
      deviceFingerprint: "iPad Pro 12.9\" (iPadOS 17 / Safari)",
      isNewDevice: false,
      ipAddress: "198.51.100.77",
      location: "Austin, TX, US",
      timestamp: pastMinutes(90),
      metadata: {},
      riskContribution: 0,
      status: "NORMAL",
    },
    {
      eventId: "EV-5510-02",
      userId: "USR-5510",
      eventType: "BENEFICIARY_ADDED",
      deviceFingerprint: "iPad Pro 12.9\" (iPadOS 17 / Safari)",
      isNewDevice: false,
      ipAddress: "198.51.100.77",
      location: "Austin, TX, US",
      timestamp: pastMinutes(65),
      metadata: { beneficiaryAccount: "ACC-CYC-1", beneficiaryName: "Smurf Shell Alpha" },
      riskContribution: 10,
      status: "NORMAL",
    },
  ];

  await Event.insertMany(sc3Events);

  const sc3Tx = {
    txId: "TX-5510-33",
    sourceAccount: "ACC-551088",
    sourceUserName: "Sophia Rodriguez",
    destAccount: "ACC-CYC-1",
    destAccountName: "Smurf Shell Alpha",
    amount: 9200,
    currency: "USD",
    type: "TRANSFER",
    timestamp: pastMinutes(25),
    status: "VERIFY_REQUIRED",
    riskScore: 78,
    riskLevel: "HIGH",
    recommendedAction: "HOLD",
    networkPattern: "CIRCULAR",
  };
  await Transaction.create(sc3Tx);

  const sc3Correlation = await correlateAtoIncident({
    userId: "USR-5510",
    transaction: sc3Tx,
    timeWindowMinutes: 90,
  });

  await Alert.create({
    alertId: "ALT-2026-003",
    userId: "USR-5510",
    userName: "Sophia Rodriguez",
    sourceAccount: "ACC-551088",
    targetTransactionId: sc3Tx.txId,
    targetAmount: sc3Tx.amount,
    destAccount: sc3Tx.destAccount,
    destAccountName: sc3Tx.destAccountName,
    detectedAt: pastMinutes(25),
    compositeRiskScore: sc3Correlation.compositeRiskScore,
    severity: sc3Correlation.severity,
    recommendedAction: sc3Correlation.recommendedAction,
    status: "NEW",
    attackChain: {
      sequenceDetected: sc3Correlation.isFullSequence,
      timeWindowMinutes: 65,
      events: sc3Correlation.chainEvents,
    },
    graphSignals: sc3Correlation.graphSignals,
    baselineDeviation: sc3Correlation.baselineDeviation,
    explanations: sc3Correlation.explanations,
    analystNotes: [],
  });

  // 6. Scenario 4: Normal User Routine Transfer (David Miller - USR-1001)
  const sc4Events = [
    {
      eventId: "EV-1001-01",
      userId: "USR-1001",
      eventType: "LOGIN",
      deviceFingerprint: "iPhone 14 (iOS 17.2 / Mobile Banking)",
      isNewDevice: false,
      ipAddress: "192.0.2.100",
      location: "Denver, CO, US",
      timestamp: pastMinutes(12),
      metadata: {},
      riskContribution: 0,
      status: "NORMAL",
    },
  ];

  await Event.insertMany(sc4Events);

  const sc4Tx = {
    txId: "TX-1001-11",
    sourceAccount: "ACC-100123",
    sourceUserName: "David Miller",
    destAccount: "ACC-METER-88",
    destAccountName: "Denver Water & Utility",
    amount: 115.5,
    currency: "USD",
    type: "PAYMENT",
    timestamp: pastMinutes(5),
    status: "APPROVED",
    riskScore: 12,
    riskLevel: "LOW",
    recommendedAction: "MONITOR",
    networkPattern: "NONE",
  };
  await Transaction.create(sc4Tx);

  console.log("Database seeded successfully with 4 realistic banking scenarios!");
}

module.exports = {
  seedDatabase,
};
