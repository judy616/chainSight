const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    accountNumber: { type: String, required: true, unique: true },
    accountType: { type: String, default: "CHECKING" },
    currentBalance: { type: Number, default: 0 },
    baseline: {
      avgTransferAmount: { type: Number, default: 250 },
      maxNormalTransfer: { type: Number, default: 1200 },
      typicalHours: { type: [Number], default: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] },
      knownDevices: { type: [String], default: [] },
      knownIps: { type: [String], default: [] },
      knownLocations: { type: [String], default: [] },
      trustedBeneficiaries: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
