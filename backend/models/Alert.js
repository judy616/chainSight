const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    sourceAccount: { type: String, required: true },
    targetTransactionId: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    destAccount: { type: String, required: true },
    destAccountName: { type: String, default: "Unknown" },
    detectedAt: { type: Date, default: Date.now, index: true },
    compositeRiskScore: { type: Number, required: true },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },
    recommendedAction: {
      type: String,
      enum: ["MONITOR", "VERIFY", "HOLD", "ALERT"],
      required: true,
    },
    status: {
      type: String,
      enum: ["NEW", "UNDER_REVIEW", "VERIFY_SENT", "HELD", "BLOCKED", "RESOLVED_BENIGN"],
      default: "NEW",
    },
    attackChain: {
      sequenceDetected: { type: Boolean, default: false },
      timeWindowMinutes: { type: Number, default: 0 },
      events: [
        {
          eventId: String,
          eventType: String,
          label: String,
          device: String,
          location: String,
          ip: String,
          timestamp: Date,
          deltaMinutes: Number,
          riskDelta: Number,
          runningScore: Number,
          status: String,
        },
      ],
    },
    graphSignals: {
      pattern: { type: String, default: "NONE" },
      inDegree: { type: Number, default: 0 },
      outDegree: { type: Number, default: 0 },
      rapidPassThroughDetected: { type: Boolean, default: false },
      cycleDetected: { type: Boolean, default: false },
      destRiskScore: { type: Number, default: 0 },
      details: String,
    },
    baselineDeviation: {
      amountRatio: { type: Number, default: 1 },
      isUnusualHour: { type: Boolean, default: false },
      isNewDevice: { type: Boolean, default: false },
      isNewBeneficiary: { type: Boolean, default: false },
      typicalAmount: { type: Number, default: 0 },
      typicalHours: [Number],
      knownDevices: [String],
    },
    explanations: [String],
    analystNotes: [
      {
        action: String,
        note: String,
        timestamp: { type: Date, default: Date.now },
        author: { type: String, default: "Fraud Analyst" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);
