import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discount: { type: Number, required: true },
  maxDiscount: {type: Number, required: true},
  minOrderVal: {type: Number, required: true},
  validUpto: { type: Date, required: true },
  maxUsesPerUser: { type: Number, default: 0 }, // 0 = unlimited
  isFirstOrderOnly: { type: Boolean, default: false },
  usedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    count: { type: Number, default: 0 }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);
