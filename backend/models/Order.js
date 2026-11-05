import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    id: String,
    name: String,
    price: Number,
    qty: Number,
    image: String,
    category: String,
    subcategory: String,
    stock: Number,
  }],
  subtotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  couponCode: { type: String, default: "" },
  couponDiscount: { type: Number, default: 0 },
  freeCashUsed: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ["cod", "upi", "razorpay", "card", "netbanking"], default: "cod" },
  paymentId: { type: String, default: "" },
  upiId: { type: String, default: "" },
  trackingId: { type: String, default: "" },
  estimatedDelivery: { type: String, default: "" },
  address: {
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" },
  },
  status: {
    type: String,
    enum: ["placed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"],
    default: "placed"
  },
  refundStatus: {
    type: String,
    enum: ["none", "pending", "processed", "credited"],
    default: "none"
  },
  refundAmount: { type: Number, default: 0 },
  refundMethod: { type: String, enum: ["gift_card", "original_payment"], default: "gift_card" },
  refundReason: { type: String, default: "" },
  refundRemarks: { type: String, default: "" },
  refundProcessedAt: { type: Date },
  refundCreditedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
