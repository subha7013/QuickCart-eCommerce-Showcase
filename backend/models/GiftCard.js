import mongoose from "mongoose";

const giftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      default: "Promotional Gift Card"
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isRevoked: {
      type: Boolean,
      default: false
    },
    revokedReason: {
      type: String,
      default: ""
    },
    revokedAt: {
      type: Date
    },
    expiresAt: {
      type: Date,
      required: true
    },
    maxRedemptions: {
      type: Number,
      default: 1 // 1 for single-use user voucher, >1 for multi-user promo codes
    },
    redemptionCount: {
      type: Number,
      default: 0
    },
    redeemedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        userEmail: {
          type: String,
          default: ""
        },
        amountRedeemed: {
          type: Number,
          required: true
        },
        redeemedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    createdBy: {
      type: String,
      default: "admin"
    }
  },
  { timestamps: true }
);

export default mongoose.model("GiftCard", giftCardSchema);
