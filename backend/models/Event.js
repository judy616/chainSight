const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      required: true,
      enum: ["LOGIN", "PASSWORD_CHANGE", "BENEFICIARY_ADDED", "TRANSFER_ATTEMPT", "MFA_PROMPT", "SESSION_REVOKED"],
    },
    deviceFingerprint: { type: String, default: "Unknown Device" },
    isNewDevice: { type: Boolean, default: false },
    ipAddress: { type: String, default: "0.0.0.0" },
    isSuspiciousIp: { type: Boolean, default: false },
    location: { type: String, default: "Unknown Location" },
    isSuspiciousLocation: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    riskContribution: { type: Number, default: 0 },
    status: { type: String, default: "LOGGED" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
