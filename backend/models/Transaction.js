const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    txId: { type: String, required: true, unique: true },
    sourceAccount: { type: String, required: true, index: true },
    sourceUserName: { type: String, default: "Account Holder" },
    destAccount: { type: String, required: true, index: true },
    destAccountName: { type: String, default: "Beneficiary" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    type: {
      type: String,
      enum: ["TRANSFER", "CASH_OUT", "PAYMENT", "WIRE"],
      default: "TRANSFER",
    },
    timestamp: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "VERIFY_REQUIRED", "HELD", "BLOCKED"],
      default: "PENDING",
    },
    riskScore: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
    },
    riskFactors: [
      {
        code: String,
        title: String,
        score: Number,
        details: String,
      },
    ],
    recommendedAction: {
      type: String,
      enum: ["MONITOR", "VERIFY", "HOLD", "ALERT"],
      default: "MONITOR",
    },
    actionTaken: { type: String, default: "PENDING" },
    networkPattern: {
      type: String,
      enum: ["NONE", "FAN_IN", "FAN_OUT", "RAPID_PASS_THROUGH", "CIRCULAR"],
      default: "NONE",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
