import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, default: "Home" }, // Home, Work, Other
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  line1: { type: String, required: true },
  line2: { type: String, default: "" },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: "India" },
  isDefault: { type: Boolean, default: false }
});

const walletGrantSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => "wgrant_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7)
  },
  amount: { type: Number, required: true },
  originalAmount: { type: Number, required: true },
  reason: { type: String, default: "Promotional Bonus" },
  source: { type: String, default: "admin_airdrop" }, // welcome, admin_airdrop, gift_card, refund, admin_revoke
  isRevoked: { type: Boolean, default: false },
  revokedReason: { type: String, default: "" },
  revokedAt: { type: Date },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: String,
  passwordHash: { type: String, required: true },
  freeCash: { type: Number, default: 0 }, // Total active unexpired Free Cash
  walletGrants: [walletGrantSchema],
  addresses: [addressSchema],
  savedPaymentMethods: [
    {
      id: String,
      type: { type: String, default: "upi" }, // upi, card, netbanking
      details: String,
      isDefault: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

export default mongoose.model("User", userSchema);
