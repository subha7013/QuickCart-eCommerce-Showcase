import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userEmail: { type: String, required: true },
  orderId: { type: String, default: "" },
  subject: { type: String, required: true },
  category: {
    type: String,
    enum: ["Order Tracking", "Refund / Cancellation", "Product Quality", "Delivery Delay", "Payment Issue", "Other"],
    default: "Order Tracking"
  },
  chatHistory: [
    {
      sender: { type: String, enum: ["user", "bot", "agent"], required: true },
      text: { type: String, required: true },
      time: { type: Date, default: Date.now }
    }
  ],
  status: {
    type: String,
    enum: ["open", "in_progress", "resolved", "closed"],
    default: "open"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  assignedTo: { type: String, default: "Admin Support Team" },
  resolutionNotes: { type: String, default: "" },
  adminRemarks: [
    {
      remark: { type: String, required: true },
      by: { type: String, default: "Admin Support Team" },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export default mongoose.model("Incident", incidentSchema);
