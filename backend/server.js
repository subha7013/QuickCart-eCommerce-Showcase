import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";

import User from "./models/User.js";
import Order from "./models/Order.js";
import Coupon from "./models/Coupon.js";
import Product from "./models/Product.js";
import Incident from "./models/Incident.js";
import Setting from "./models/Setting.js";
import GiftCard from "./models/GiftCard.js";
import { requireAuth } from "./middleware/requireAuth.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// -------------------- APP INIT --------------------
const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Allow frontend origins to access the backend dynamically
const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const defaultOrigins = [
  "https://orderquickcart.netlify.app",
  "https://speedmart-order.netlify.app",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001"
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server) or matched origins
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith(".netlify.app") ||
      origin.endsWith(".vercel.app")
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

// -------------------- STATIC FILES --------------------
app.use(express.static("../frontend"));

// -------------------- SEED DEFAULT GIFT CARDS --------------------
async function seedDefaultGiftCards() {
  try {
    const count = await GiftCard.countDocuments();
    if (count === 0) {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 2); // 2 years validity
      const defaultCards = [
        {
          code: "QUICKCART500",
          title: "QuickCart Mega Welcome Promo",
          amount: 500,
          maxRedemptions: 1000,
          expiresAt: farFuture,
          isActive: true
        },
        {
          code: "DIWALI250",
          title: "Diwali Special Festival Gift Card",
          amount: 250,
          maxRedemptions: 1000,
          expiresAt: farFuture,
          isActive: true
        },
        {
          code: "FREECASH",
          title: "QuickCart Wallet FreeCash Voucher",
          amount: 150,
          maxRedemptions: 1000,
          expiresAt: farFuture,
          isActive: true
        },
        {
          code: "FESTIVE100",
          title: "Festive Joy Promo Voucher",
          amount: 100,
          maxRedemptions: 1000,
          expiresAt: farFuture,
          isActive: true
        },
        {
          code: "FLIPKART50",
          title: "Partner Promo Gift Voucher",
          amount: 50,
          maxRedemptions: 1000,
          expiresAt: farFuture,
          isActive: true
        }
      ];
      await GiftCard.insertMany(defaultCards);
      console.log("✅ Seeded default promotional gift cards into MongoDB");
    }
  } catch (err) {
    console.error("GiftCard seed error:", err);
  }
}

// -------------------- DB CONNECT --------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`✅ MongoDB Connected to ${process.env.MONGO_URI}`);
    seedDefaultGiftCards();
  })
  .catch(err => console.log("❌ MongoDB Error:", err));

// -------------------- ADMIN AUTH MIDDLEWARE --------------------
function requireAdmin(req, res, next) {
  const adminKey = req.headers["x-admin-key"];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ ok: false, msg: "Forbidden: invalid admin key" });
  }
  next();
}

// -------------------- WALLET & EXPIRING FREE CASH HELPERS --------------------
function refreshUserWallet(user) {
  if (!user) return 0;
  if (!user.walletGrants) user.walletGrants = [];
  const now = new Date();

  // If user has legacy freeCash > 0 but no grants, seed initial grant (valid 60 days)
  if (user.walletGrants.length === 0 && (user.freeCash || 0) > 0) {
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 60);
    user.walletGrants.push({
      id: "wgrant_init_" + (user._id?.toString().slice(-6) || Date.now().toString(36)),
      amount: user.freeCash,
      originalAmount: user.freeCash,
      reason: "Welcome Bonus",
      source: "welcome",
      isRevoked: false,
      expiresAt: defaultExpiry,
      createdAt: user.createdAt || new Date()
    });
  }

  // Calculate sum of active unexpired and unrevoked grants
  let activeBalance = 0;
  for (const grant of user.walletGrants) {
    if (!grant.isRevoked && new Date(grant.expiresAt) > now && grant.amount > 0) {
      activeBalance += grant.amount;
    }
  }

  user.freeCash = activeBalance;
  return activeBalance;
}

function deductUserFreeCash(user, amountToDeduct) {
  if (!user || !amountToDeduct || amountToDeduct <= 0) return 0;
  refreshUserWallet(user);
  let remaining = amountToDeduct;
  const now = new Date();

  // Sort grants by earliest expiration first (FIFO), active and unrevoked only
  user.walletGrants.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));

  for (const grant of user.walletGrants) {
    if (remaining <= 0) break;
    if (!grant.isRevoked && new Date(grant.expiresAt) > now && grant.amount > 0) {
      const take = Math.min(grant.amount, remaining);
      grant.amount -= take;
      remaining -= take;
    }
  }

  refreshUserWallet(user);
  return amountToDeduct - remaining;
}

function refundUserFreeCash(user, amountToRefund, reason = "Order Refund") {
  if (!user || !amountToRefund || amountToRefund <= 0) return;
  refreshUserWallet(user);
  const refundExpiry = new Date();
  refundExpiry.setDate(refundExpiry.getDate() + 30); // 30 days validity for refund

  user.walletGrants.push({
    id: "wgrant_ref_" + Date.now().toString(36),
    amount: amountToRefund,
    originalAmount: amountToRefund,
    reason,
    source: "refund",
    isRevoked: false,
    expiresAt: refundExpiry,
    createdAt: new Date()
  });

  refreshUserWallet(user);
}

function revokeUserFreeCash(user, amountToRevoke, reason = "Admin Credit Revocation") {
  if (!user) return 0;
  refreshUserWallet(user);
  const now = new Date();
  const currentBalance = user.freeCash || 0;
  if (currentBalance <= 0) return 0;

  const toRevoke = amountToRevoke === null || amountToRevoke === undefined || amountToRevoke >= currentBalance
    ? currentBalance
    : Number(amountToRevoke);

  if (toRevoke <= 0) return 0;
  let remaining = toRevoke;

  // Revoke from newest grants first
  const sorted = [...user.walletGrants].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  for (const grant of sorted) {
    if (remaining <= 0) break;
    if (!grant.isRevoked && new Date(grant.expiresAt) > now && grant.amount > 0) {
      const deduct = Math.min(grant.amount, remaining);
      grant.amount -= deduct;
      remaining -= deduct;
      if (grant.amount === 0) {
        grant.isRevoked = true;
        grant.revokedReason = reason;
        grant.revokedAt = now;
      }
    }
  }

  const actuallyRevoked = toRevoke - remaining;

  // Push an audit record to walletGrants
  user.walletGrants.push({
    id: "wgrant_revoke_" + Date.now().toString(36),
    amount: 0,
    originalAmount: -actuallyRevoked,
    reason: `Revoked by Admin: ${reason}`,
    source: "admin_revoke",
    isRevoked: true,
    revokedReason: reason,
    revokedAt: now,
    expiresAt: now,
    createdAt: now
  });

  refreshUserWallet(user);
  return actuallyRevoked;
}

// -------------------- AUTH ROUTES --------------------
app.post("/api/register", async (req, res) => {
  const { email, phone, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.json({ ok: false, msg: "Email already registered" });

  const hash = await bcrypt.hash(password, 10);
  const welcomeExpiry = new Date();
  welcomeExpiry.setDate(welcomeExpiry.getDate() + 60);

  const user = await User.create({
    email,
    phone,
    passwordHash: hash,
    freeCash: 150, // ₹150 welcome bonus!
    walletGrants: [
      {
        id: "wgrant_welcome_" + Date.now().toString(36),
        amount: 150,
        originalAmount: 150,
        reason: "₹150 Welcome Sign-up Bonus",
        source: "welcome",
        expiresAt: welcomeExpiry,
        createdAt: new Date()
      }
    ],
    addresses: [],
    savedPaymentMethods: [
      { id: "upi_def", type: "upi", details: (email.split("@")[0] || "user") + "@okaxis", isDefault: true }
    ]
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });
  res.json({
    ok: true,
    user: {
      email: user.email,
      phone: user.phone || "",
      freeCash: user.freeCash,
      addresses: user.addresses || [],
      savedPaymentMethods: user.savedPaymentMethods || []
    }
  });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ ok: false, msg: "User not found" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.json({ ok: false, msg: "Incorrect password" });

  refreshUserWallet(user);
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });
  res.json({
    ok: true,
    user: {
      email: user.email,
      phone: user.phone || "",
      freeCash: user.freeCash ?? 150,
      addresses: user.addresses || [],
      savedPaymentMethods: user.savedPaymentMethods || []
    }
  });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "none", secure: true });
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.json({ ok: false, msg: "User not found" });

  refreshUserWallet(user);
  await user.save();

  res.json({
    ok: true,
    email: user.email,
    phone: user.phone || "",
    user: {
      email: user.email,
      phone: user.phone || "",
      freeCash: user.freeCash ?? 150,
      addresses: user.addresses || [],
      savedPaymentMethods: user.savedPaymentMethods || []
    }
  });
});

app.post("/api/user/update", requireAuth, async (req, res) => {
  try {
    const { phone, password } = req.body;
    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
    if (!user) return res.json({ ok: false, msg: "User not found" });
    res.json({
      ok: true,
      email: user.email,
      phone: user.phone,
      user: {
        email: user.email,
        phone: user.phone || "",
        freeCash: user.freeCash ?? 150,
        addresses: user.addresses || [],
        savedPaymentMethods: user.savedPaymentMethods || []
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.json({ ok: false, msg: "Server error" });
  }
});

// -------------------- ADDRESSES --------------------
app.post("/api/user/address", requireAuth, async (req, res) => {
  try {
    const { label, name, phone, line1, line2, city, state, pincode, isDefault } = req.body;
    if (!name || !line1 || !city || !pincode) {
      return res.json({ ok: false, msg: "Name, Street address, City and PIN Code are required" });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ ok: false, msg: "User not found" });

    const newAddress = {
      id: "addr_" + Date.now().toString(36),
      label: label || "Home",
      name,
      phone: phone || user.phone || "",
      line1,
      line2: line2 || "",
      city,
      state: state || "West Bengal",
      pincode,
      country: "India",
      isDefault: isDefault || (user.addresses.length === 0)
    };

    if (newAddress.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    user.addresses.push(newAddress);
    await user.save();

    res.json({ ok: true, addresses: user.addresses });
  } catch (err) {
    console.error("Add address error:", err);
    res.json({ ok: false, msg: "Failed to save address" });
  }
});

app.delete("/api/user/address/:id", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ ok: false, msg: "User not found" });

    user.addresses = user.addresses.filter(a => a.id !== req.params.id);
    await user.save();

    res.json({ ok: true, addresses: user.addresses });
  } catch (err) {
    res.json({ ok: false, msg: "Failed to delete address" });
  }
});

// -------------------- GIFT CARD / FREE CASH (SECURE REDEMPTION) --------------------
app.post("/api/user/redeem-giftcard", requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ ok: false, msg: "Please enter a valid gift card or voucher code." });
    }

    const trimmed = code.trim().toUpperCase();

    // 1. Verify gift card exists in database
    const card = await GiftCard.findOne({ code: trimmed });
    if (!card) {
      return res.status(404).json({
        ok: false,
        msg: `Gift card code "${trimmed}" is invalid or does not exist.`
      });
    }

    // 2. Verify active status and non-revocation
    if (!card.isActive || card.isRevoked) {
      return res.status(400).json({
        ok: false,
        msg: card.revokedReason
          ? `This gift card was revoked: ${card.revokedReason}`
          : "This gift card is inactive or has been revoked."
      });
    }

    // 3. Verify expiration
    if (new Date(card.expiresAt) <= new Date()) {
      return res.status(400).json({
        ok: false,
        msg: "This gift card has expired and can no longer be redeemed."
      });
    }

    // 4. Verify whether user has already redeemed this specific gift card
    const alreadyRedeemed = (card.redeemedBy || []).some(
      r => r.userId.toString() === req.user.id.toString()
    );
    if (alreadyRedeemed) {
      return res.status(400).json({
        ok: false,
        msg: `You have already redeemed gift card "${trimmed}" on your account.`
      });
    }

    // 5. Verify maximum redemptions quota limit
    if (card.redemptionCount >= card.maxRedemptions) {
      card.isActive = false;
      await card.save();
      return res.status(400).json({
        ok: false,
        msg: "This promotional voucher has reached its redemption quota limit."
      });
    }

    // 6. User account verification
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ ok: false, msg: "User account not found." });

    // 7. Atomic balance credit & grant addition
    const voucherExpiry = new Date();
    voucherExpiry.setDate(voucherExpiry.getDate() + 45); // 45 days validity
    if (!user.walletGrants) user.walletGrants = [];
    user.walletGrants.push({
      id: "wgrant_gc_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
      amount: card.amount,
      originalAmount: card.amount,
      reason: `Gift Voucher (${card.code}) - ${card.title || "Promotional Credit"}`,
      source: "gift_card",
      isRevoked: false,
      expiresAt: voucherExpiry,
      createdAt: new Date()
    });

    refreshUserWallet(user);
    await user.save();

    // 8. Record redemption on GiftCard atomically
    card.redemptionCount += 1;
    card.redeemedBy.push({
      userId: user._id,
      userEmail: user.email,
      amountRedeemed: card.amount,
      redeemedAt: new Date()
    });
    if (card.redemptionCount >= card.maxRedemptions) {
      card.isActive = false;
    }
    await card.save();

    res.json({
      ok: true,
      freeCash: user.freeCash,
      added: card.amount,
      msg: `🎉 Success! ₹${card.amount} Free Cash added to your QuickCart balance from voucher ${card.code}!`
    });
  } catch (err) {
    console.error("POST /api/user/redeem-giftcard error:", err);
    res.status(500).json({ ok: false, msg: "Failed to redeem gift card. Please try again." });
  }
});

// -------------------- CUSTOMER SUPPORT / INCIDENTS --------------------
app.post("/api/support/escalate", requireAuth, async (req, res) => {
  try {
    const { orderId, subject, category, chatHistory, priority } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ ok: false, msg: "User not found" });

    const ticketId = "INC-" + Math.floor(10000 + Math.random() * 90000);

    const incident = await Incident.create({
      ticketId,
      userId: user._id,
      userEmail: user.email,
      orderId: orderId || "",
      subject: subject || "Customer Support Escalation",
      category: category || "Order Tracking",
      chatHistory: chatHistory || [],
      status: "open",
      priority: priority || "high",
      assignedTo: "Admin Priority Support Team",
      resolutionNotes: ""
    });

    res.json({
      ok: true,
      ticketId,
      incident,
      msg: `Ticket #${ticketId} created successfully. Escalated to admin support team.`
    });
  } catch (err) {
    console.error("Escalation error:", err);
    res.json({ ok: false, msg: "Failed to escalate incident" });
  }
});

app.get("/api/support/my-incidents", requireAuth, async (req, res) => {
  try {
    const incidents = await Incident.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ ok: true, incidents });
  } catch (err) {
    res.json({ ok: false, msg: "Failed to fetch incidents" });
  }
});

app.get("/api/admin/incidents", requireAdmin, async (req, res) => {
  try {
    const incidents = await Incident.find({}).sort({ createdAt: -1 });
    res.json({ ok: true, incidents });
  } catch (err) {
    res.json({ ok: false, msg: "Failed to fetch incidents" });
  }
});

app.put("/api/admin/incidents/:id", requireAdmin, async (req, res) => {
  try {
    const { status, resolutionNotes, priority } = req.body;
    const update = {};
    if (status) update.status = status;
    if (resolutionNotes !== undefined) update.resolutionNotes = resolutionNotes;
    if (priority) update.priority = priority;

    const incident = await Incident.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!incident) return res.json({ ok: false, msg: "Ticket not found" });

    res.json({ ok: true, incident });
  } catch (err) {
    res.json({ ok: false, msg: "Failed to update incident" });
  }
});

// Admin: Add escalation remark / note to customer incident
app.post("/api/admin/incidents/:id/remark", requireAdmin, async (req, res) => {
  try {
    const { remark, status, priority, resolutionNotes } = req.body;
    if (!remark || !remark.trim()) {
      return res.status(400).json({ ok: false, msg: "Remark text is required" });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ ok: false, msg: "Ticket not found" });

    if (!incident.adminRemarks) incident.adminRemarks = [];
    incident.adminRemarks.push({
      remark: remark.trim(),
      by: "Admin Support",
      createdAt: new Date()
    });

    if (status) incident.status = status;
    if (priority) incident.priority = priority;
    if (resolutionNotes !== undefined) incident.resolutionNotes = resolutionNotes;

    if (!incident.chatHistory) incident.chatHistory = [];
    incident.chatHistory.push({
      sender: "agent",
      text: `[Admin Escalation Note]: ${remark.trim()}`,
      time: new Date()
    });

    await incident.save();
    res.json({ ok: true, incident, msg: "Escalation remark recorded successfully" });
  } catch (err) {
    console.error("POST /api/admin/incidents/:id/remark error:", err);
    res.status(500).json({ ok: false, msg: "Failed to add remark" });
  }
});

// -------------------- COUPONS --------------------
app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ ok: true, coupons });
  } catch (error) {
    console.error("GET /api/admin/coupons error:", error);
    res.status(500).json({ ok: false, msg: "Failed to load coupons" });
  }
});

app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    const discount = Number(req.body.discount);
    const maxDiscount = Number(req.body.maxDiscount);
    const minOrderVal = Number(req.body.minOrderVal);
    const maxUsesPerUser = Number(req.body.maxUsesPerUser || 0);
    const validUpto = new Date(req.body.validUpto);

    if (!code || !Number.isFinite(discount) || discount <= 0 || discount > 100 ||
      !Number.isFinite(maxDiscount) || maxDiscount < 0 ||
      !Number.isFinite(minOrderVal) || minOrderVal < 0 ||
      !Number.isFinite(maxUsesPerUser) || maxUsesPerUser < 0 ||
      Number.isNaN(validUpto.getTime()) || validUpto <= new Date()) {
      return res.status(400).json({ ok: false, msg: "Enter a valid code, discount, limits, and future expiry date" });
    }

    const coupon = await Coupon.create({
      code,
      discount,
      maxDiscount,
      minOrderVal,
      maxUsesPerUser,
      validUpto,
      isFirstOrderOnly: Boolean(req.body.isFirstOrderOnly),
      isActive: true
    });
    res.json({ ok: true, coupon });
  } catch (error) {
    const isDuplicate = error.code === 11000;
    res.status(isDuplicate ? 409 : 400).json({
      ok: false,
      msg: isDuplicate ? "A coupon with this code already exists" : error.message
    });
  }
});

app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ ok: false, msg: "Coupon not found" });
    res.json({ ok: true, msg: "Coupon deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/coupons/:id error:", error);
    res.status(400).json({ ok: false, msg: "Failed to delete coupon" });
  }
});

app.post("/api/coupon/validate", requireAuth, async (req, res) => {
  const { code, subtotal } = req.body;

  if (!code) {
    return res.json({ ok: false, msg: "No code provided" });
  }

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true
  });

  if (!coupon) {
    return res.json({ ok: false, msg: "Invalid or inactive coupon" });
  }

  if (new Date() > new Date(coupon.validUpto)) {
    return res.json({ ok: false, msg: "Coupon expired" });
  }

  if ((Number(subtotal) || 0) < coupon.minOrderVal) {
    return res.json({
      ok: false,
      msg: `Minimum order value is ₹${coupon.minOrderVal}`
    });
  }

  if (coupon.isFirstOrderOnly) {
    const orderCount = await Order.countDocuments({
      userId: req.user.id
    });

    if (orderCount > 0) {
      return res.json({
        ok: false,
        msg: "Valid for first order only"
      });
    }
  }

  if (coupon.maxUsesPerUser > 0) {
    const usage = coupon.usedBy.find(
      u => u.userId.toString() === req.user.id
    );

    if (usage && usage.count >= coupon.maxUsesPerUser) {
      return res.json({
        ok: false,
        msg: "Usage limit reached for this coupon"
      });
    }
  }

  let discountAmount = (Number(subtotal) * coupon.discount) / 100;
  if (coupon.maxDiscount > 0) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  }

  res.json({
    ok: true,
    discount: Number(discountAmount.toFixed(2)),
    discountPercent: coupon.discount
  });
});

app.get("/api/coupon/recommendations", requireAuth, async (req, res) => {
  try {
    const subtotal = Number(req.query.subtotal) || 0;
    const now = new Date();

    const coupons = await Coupon.find({ isActive: true, validUpto: { $gt: now } }).lean();
    const orderCount = await Order.countDocuments({ userId: req.user.id });

    const recommendations = coupons.map((coupon) => {
      let eligible = true;
      let reason = null;

      if (coupon.isFirstOrderOnly && orderCount > 0) {
        eligible = false;
        reason = "Valid for first order only";
      }

      if (eligible && coupon.maxUsesPerUser > 0) {
        const usage = coupon.usedBy.find((u) => u.userId.toString() === req.user.id);
        if (usage && usage.count >= coupon.maxUsesPerUser) {
          eligible = false;
          reason = "You've reached the usage limit";
        }
      }

      const meetsMinOrder = subtotal >= coupon.minOrderVal;
      const shortfall = meetsMinOrder ? 0 : Number((coupon.minOrderVal - subtotal).toFixed(2));
      const rawDiscount = (subtotal * coupon.discount) / 100;
      const saving = Number(
        Math.min(rawDiscount, coupon.maxDiscount > 0 ? coupon.maxDiscount : rawDiscount).toFixed(2)
      );

      return {
        code: coupon.code,
        discount: coupon.discount,
        maxDiscount: coupon.maxDiscount,
        minOrderVal: coupon.minOrderVal,
        isFirstOrderOnly: coupon.isFirstOrderOnly,
        eligible,
        reason,
        meetsMinOrder,
        shortfall,
        saving: meetsMinOrder ? saving : 0,
        potentialSaving: saving,
      };
    });

    recommendations.sort((a, b) => {
      const scoreA = (a.eligible ? 2 : 0) + (a.meetsMinOrder ? 1 : 0);
      const scoreB = (b.eligible ? 2 : 0) + (b.meetsMinOrder ? 1 : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.saving - a.saving;
    });

    res.json({ ok: true, recommendations });
  } catch (err) {
    console.error("recommendations error:", err);
    res.json({ ok: false, msg: "Failed to fetch recommendations" });
  }
});

// -------------------- PRODUCT / INVENTORY ROUTES --------------------
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({}, { __v: 0 }).lean();
    res.json({ ok: true, products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    res.json({ ok: false, msg: "Failed to fetch products" });
  }
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const products = await Product.find({}).lean();
    res.json({ ok: true, products });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    res.json({ ok: false, msg: "Failed to fetch products" });
  }
});

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const { name, price, mrp, category, subcategory, stock, image, limitPerOrder, offerTag, discountPercent, featured } = req.body;

    if (!name || !price || !category) {
      return res.json({ ok: false, msg: "Name, price and category are required" });
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.json({ ok: false, msg: "Price must be a positive number" });
    }

    const mrpNum = Number(mrp) || Math.round(priceNum * 1.35);
    const stockNum = Number(stock) || 0;
    const limitNum = Number(limitPerOrder) > 0 ? 1 : 0;
    const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    const suffix = Date.now().toString(36);
    const id = `${baseId}_${suffix}`;

    const product = await Product.create({
      id,
      name: name.trim(),
      price: priceNum,
      mrp: mrpNum,
      category: category.trim(),
      subcategory: (subcategory || '').trim(),
      stock: stockNum,
      image: image || '',
      limitPerOrder: limitNum,
      offerTag: offerTag || '',
      discountPercent: Number(discountPercent) || Math.max(0, Math.round(((mrpNum - priceNum) / mrpNum) * 100)),
      featured: Boolean(featured)
    });

    res.json({ ok: true, product });
  } catch (error) {
    console.error("POST /api/admin/products error:", error);
    res.json({ ok: false, msg: error.message || "Failed to add product" });
  }
});

app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const { stock, price, mrp, limitPerOrder, offerTag, discountPercent, featured, name, category, subcategory, image } = req.body;
    const updateData = {};

    if (stock !== undefined) {
      const stockNum = Number(stock);
      if (isNaN(stockNum) || stockNum < 0) return res.json({ ok: false, msg: "Stock must be non-negative" });
      updateData.stock = stockNum;
    }

    if (price !== undefined) {
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum <= 0) return res.json({ ok: false, msg: "Price must be positive" });
      updateData.price = priceNum;
    }

    if (mrp !== undefined) updateData.mrp = Number(mrp);
    if (limitPerOrder !== undefined) updateData.limitPerOrder = Number(limitPerOrder) > 0 ? 1 : 0;
    if (offerTag !== undefined) updateData.offerTag = offerTag;
    if (discountPercent !== undefined) updateData.discountPercent = Number(discountPercent);
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (name) updateData.name = name.trim();
    if (category) updateData.category = category.trim();
    if (subcategory !== undefined) updateData.subcategory = subcategory.trim();
    if (image !== undefined) updateData.image = image;

    const product = await Product.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });
    if (!product) return res.json({ ok: false, msg: "Product not found" });

    res.json({ ok: true, product });
  } catch (error) {
    console.error("PUT /api/admin/products error:", error);
    res.json({ ok: false, msg: "Failed to update product" });
  }
});

// Admin: Apply specific offer / discount feature on product
app.put("/api/admin/products/:id/offer", requireAdmin, async (req, res) => {
  try {
    const { offerTag, mrp, discountPercent, featured, price } = req.body;
    const update = {};
    if (offerTag !== undefined) update.offerTag = offerTag;
    if (mrp !== undefined) update.mrp = Number(mrp);
    if (discountPercent !== undefined) update.discountPercent = Number(discountPercent);
    if (featured !== undefined) update.featured = Boolean(featured);
    if (price !== undefined) update.price = Number(price);

    const product = await Product.findOneAndUpdate({ id: req.params.id }, update, { new: true });
    if (!product) return res.json({ ok: false, msg: "Product not found" });

    res.json({ ok: true, product });
  } catch (error) {
    res.json({ ok: false, msg: "Failed to update offer" });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    if (!product) return res.json({ ok: false, msg: "Product not found" });
    res.json({ ok: true, msg: "Product removed successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/products error:", error);
    res.json({ ok: false, msg: "Failed to remove product" });
  }
});

// -------------------- ORDERS --------------------
app.get("/api/orders", requireAuth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ ok: true, orders });
});

app.post("/api/checkout", requireAuth, async (req, res) => {
  const {
    items,
    subtotal,
    paymentMethod,
    paymentId,
    upiId,
    couponCode,
    couponDiscount,
    freeCashUsed,
    address
  } = req.body;

  if (!items || items.length === 0) {
    return res.json({ ok: false, msg: "Cart is empty" });
  }

  if (!address || typeof address !== 'object' || !address.name?.trim() || !address.line1?.trim() || !address.city?.trim() || !address.pincode?.trim()) {
    return res.json({ ok: false, msg: "Complete delivery address is required. Please select or add an address." });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.json({ ok: false, msg: "User account not found" });

  // If user has no saved addresses in account and no valid address was supplied
  if ((!user.addresses || user.addresses.length === 0) && (!address.line1 || !address.city || !address.pincode)) {
    return res.json({ ok: false, msg: "No delivery address on file. Please add a delivery address to complete your order." });
  }

  // Stock Validation
  const productIds = items.map(item => item.id).filter(Boolean);
  const dbProducts = await Product.find({ id: { $in: productIds } }).lean();
  const stockMap = {};
  for (const p of dbProducts) {
    stockMap[p.id] = p.stock;
  }

  for (const item of items) {
    const dbProduct = item.id ? dbProducts.find(p => p.id === item.id) : null;
    const limitPerOrder = Number(dbProduct?.limitPerOrder || item.limitPerOrder || 0);
    if (limitPerOrder > 0 && Number(item.qty) > limitPerOrder) {
      return res.json({ ok: false, msg: `"${item.name}" is limited to 1 unit per order` });
    }
    if (!item.id) continue;
    const availableStock = stockMap[item.id];
    if (availableStock === undefined) continue;
    if (availableStock === 0) {
      return res.json({ ok: false, msg: `"${item.name}" is out of stock` });
    }
    if (item.qty > availableStock) {
      return res.json({ ok: false, msg: `Only ${availableStock} unit(s) of "${item.name}" are available` });
    }
  }

  // Coupon Validation
  const orderSubtotal = Number(subtotal) || items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);
  const normalizedCoupon = couponCode ? String(couponCode).trim().toUpperCase() : '';
  let expectedDiscount = 0;
  let activeCoupon = null;

  if (normalizedCoupon) {
    activeCoupon = await Coupon.findOne({ code: normalizedCoupon, isActive: true });
    if (!activeCoupon) return res.json({ ok: false, msg: "Invalid coupon code" });
    if (new Date() > new Date(activeCoupon.validUpto)) return res.json({ ok: false, msg: "Coupon expired" });

    if (activeCoupon.isFirstOrderOnly) {
      const orderCount = await Order.countDocuments({ userId: req.user.id });
      if (orderCount > 0) return res.json({ ok: false, msg: "Valid for first order only" });
    }

    if (activeCoupon.maxUsesPerUser > 0) {
      const usage = activeCoupon.usedBy.find(u => u.userId.toString() === req.user.id);
      if (usage && usage.count >= activeCoupon.maxUsesPerUser) {
        return res.json({ ok: false, msg: "Usage limit reached for this coupon" });
      }
    }

    if (orderSubtotal < activeCoupon.minOrderVal) {
      return res.json({ ok: false, msg: `Minimum order value is ₹${activeCoupon.minOrderVal}` });
    }

    expectedDiscount = (orderSubtotal * activeCoupon.discount) / 100;
    if (activeCoupon.maxDiscount > 0) {
      expectedDiscount = Math.min(expectedDiscount, activeCoupon.maxDiscount);
    }
    expectedDiscount = Number(expectedDiscount.toFixed(2));
  }

  // Delivery Fee Calculation
  function calculateDeliveryFee(subtotal) {
    if (subtotal >= 199) return 0;
    if (subtotal >= 100) return 20;
    return 40;
  }

  const deliveryFee = calculateDeliveryFee(orderSubtotal);

  // Free Cash Validation & Deduction
  const userFreeCash = Number(user?.freeCash || 0);
  const freeCashToApply = Math.min(Number(freeCashUsed || 0), userFreeCash);

  const orderTotal = Math.max(
    0,
    orderSubtotal - expectedDiscount + deliveryFee - freeCashToApply
  );

  // Generate Tracking ID & Estimated Delivery
  const trackingId = "QC-TRK-" + Math.floor(100000 + Math.random() * 900000);
  const estimatedDelivery = "Today in 12-15 Mins";

  const order = await Order.create({
    userId: req.user.id,
    items,
    subtotal: orderSubtotal,
    deliveryFee,
    total: orderTotal,
    couponCode: normalizedCoupon,
    couponDiscount: expectedDiscount,
    freeCashUsed: freeCashToApply,
    paymentMethod: paymentMethod || "cod",
    paymentId: paymentId || ("pay_sim_" + Date.now().toString(36)),
    upiId: paymentMethod === "upi" ? (upiId || "") : "",
    trackingId,
    estimatedDelivery,
    address,
    status: "placed"
  });

  // Deduct Free Cash from user balance and wallet grants
  if (freeCashToApply > 0 && user) {
    deductUserFreeCash(user, freeCashToApply);
    await user.save();
  }

  // Record coupon usage
  if (activeCoupon) {
    const usageIndex = activeCoupon.usedBy.findIndex(u => u.userId.toString() === req.user.id);
    if (usageIndex > -1) {
      activeCoupon.usedBy[usageIndex].count += 1;
    } else {
      activeCoupon.usedBy.push({ userId: req.user.id, count: 1 });
    }
    await activeCoupon.save();
  }

  // Decrement Stock
  for (const item of items) {
    if (!item.id || stockMap[item.id] === undefined) continue;
    await Product.findOneAndUpdate(
      { id: item.id, stock: { $gte: item.qty } },
      { $inc: { stock: -item.qty } }
    );
  }

  res.json({ ok: true, order, trackingId, freeCash: user ? user.freeCash : 0 });
});

// -------------------- REAL RAZORPAY PAYMENT GATEWAY --------------------

// 1. Create Razorpay Order
app.post("/api/razorpay/create-order", requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ ok: false, msg: "Invalid payable order amount" });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret || key_secret.includes("replace_with_live")) {
      return res.status(400).json({
        ok: false,
        msg: "Razorpay test keys not configured. Add your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env"
      });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    // Amount in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(numAmount * 100),
      currency: "INR",
      receipt: "rcpt_" + Date.now().toString(36),
      notes: {
        userId: req.user.id
      }
    };

    const rzpOrder = await razorpay.orders.create(options);

    res.json({
      ok: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: key_id
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);
    res.status(500).json({ ok: false, msg: "Failed to initiate Razorpay order: " + (error.message || "Gateway error") });
  }
});

// 2. Verify Razorpay Payment Signature & Place Order
app.post("/api/razorpay/verify-payment", requireAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      subtotal,
      couponCode,
      couponDiscount,
      freeCashUsed,
      address
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ ok: false, msg: "Incomplete Razorpay payment verification parameters" });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({ ok: false, msg: "Server Razorpay secret is not configured" });
    }

    // Verify cryptographic HMAC SHA256 signature
    const bodyText = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(bodyText.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    if (!isAuthentic) {
      return res.status(400).json({ ok: false, msg: "Razorpay payment verification failed: Invalid signature" });
    }

    // Stock & Cart Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ ok: false, msg: "Cart is empty" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ ok: false, msg: "User account not found" });

    const orderSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1), 0);
    const expectedDiscount = Number(couponDiscount) || 0;
    const deliveryFee = orderSubtotal >= 199 ? 0 : orderSubtotal >= 100 ? 20 : 40;

    const userFreeCash = Number(user.freeCash || 0);
    const freeCashToApply = Math.min(Number(freeCashUsed || 0), userFreeCash);

    const orderTotal = Math.max(0, orderSubtotal - expectedDiscount + deliveryFee - freeCashToApply);
    const trackingId = "QC-TRK-" + Math.floor(100000 + Math.random() * 900000);

    const order = await Order.create({
      userId: req.user.id,
      items,
      subtotal: orderSubtotal,
      deliveryFee,
      total: orderTotal,
      couponCode: couponCode || "",
      couponDiscount: expectedDiscount,
      freeCashUsed: freeCashToApply,
      paymentMethod: "razorpay",
      paymentId: razorpay_payment_id,
      trackingId,
      estimatedDelivery: "Today in 12-15 Mins",
      address,
      status: "placed"
    });

    if (freeCashToApply > 0) {
      deductUserFreeCash(user, freeCashToApply);
      await user.save();
    }

    for (const item of items) {
      if (!item.id) continue;
      await Product.findOneAndUpdate(
        { id: item.id, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } }
      );
    }

    res.json({
      ok: true,
      order,
      trackingId,
      freeCash: user.freeCash,
      msg: "Payment verified & Order placed successfully! 🎉"
    });
  } catch (error) {
    console.error("Razorpay payment verification error:", error);
    res.status(500).json({ ok: false, msg: "Failed to verify Razorpay payment" });
  }
});

// User: Cancel order
app.put("/api/orders/:id/cancel", requireAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.json({ ok: false, msg: "Invalid order ID format" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.json({ ok: false, msg: "Order not found" });

    const orderUserId = order.userId?._id?.toString() || order.userId?.toString() || "";
    const currentUserId = req.user?.id?.toString() || "";
    if (orderUserId && currentUserId && orderUserId !== currentUserId) {
      return res.json({ ok: false, msg: "Unauthorized access to order" });
    }

    const currentStatus = (order.status || 'placed').toLowerCase().trim();
    if (currentStatus === 'cancelled') {
      return res.json({ ok: false, msg: "Order is already cancelled" });
    }
    if (currentStatus !== 'placed' && currentStatus !== 'pending') {
      return res.json({ ok: false, msg: `Order is currently "${order.status}". Only Placed orders can be cancelled.` });
    }

    order.status = "cancelled";
    await order.save();

    // Restock items
    for (const item of order.items) {
      if (item.id) {
        await Product.updateOne({ id: item.id }, { $inc: { stock: item.qty } });
      }
    }

    let updatedFreeCash = undefined;
    // Refund Free Cash if used
    if (order.freeCashUsed > 0) {
      const orderUser = await User.findById(req.user.id);
      if (orderUser) {
        refundUserFreeCash(orderUser, order.freeCashUsed, `Refund for Order #${order._id.toString().slice(-6)}`);
        await orderUser.save();
        updatedFreeCash = orderUser.freeCash;
      }
    }

    res.json({ ok: true, order, freeCash: updatedFreeCash, msg: "Order cancelled and restocked" });
  } catch (error) {
    console.error("PUT /api/orders/:id/cancel error:", error);
    res.json({ ok: false, msg: "Failed to cancel order" });
  }
});

// Admin: Get all orders
app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "email phone")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ ok: true, orders });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    res.json({ ok: false, msg: "Failed to fetch admin orders" });
  }
});

// Admin: Update order status
app.put("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["placed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.json({ ok: false, msg: "Invalid order status value" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.json({ ok: false, msg: "Order not found" });

    const oldStatus = (order.status || 'placed').toLowerCase();
    order.status = status;
    await order.save();

    // Restock if cancelled
    if (oldStatus !== "cancelled" && status === "cancelled") {
      for (const item of order.items) {
        if (item.id) {
          await Product.updateOne({ id: item.id }, { $inc: { stock: item.qty } });
        }
      }
      if (order.freeCashUsed > 0 && order.userId) {
        const orderUser = await User.findById(order.userId);
        if (orderUser) {
          refundUserFreeCash(orderUser, order.freeCashUsed, `Refund for Order #${order._id.toString().slice(-6)}`);
          await orderUser.save();
        }
      }
    }

    const updatedOrder = await Order.findById(order._id).populate("userId", "email phone");
    res.json({ ok: true, order: updatedOrder });
  } catch (error) {
    console.error("PUT /api/admin/orders/:id/status error:", error);
    res.json({ ok: false, msg: "Failed to update order status" });
  }
});

// -------------------- THEME ENGINE (ADMIN CONTROLLED) --------------------
app.get("/api/theme", async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: "festivalTheme" });
    const customThemesSetting = await Setting.findOne({ key: "customThemes" });
    res.json({
      ok: true,
      theme: setting ? setting.value : "default",
      customThemes: customThemesSetting?.value || []
    });
  } catch (error) {
    console.error("GET /api/theme error:", error);
    res.json({ ok: true, theme: "default", customThemes: [] });
  }
});

app.put("/api/admin/theme", requireAdmin, async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme) return res.status(400).json({ ok: false, msg: "Theme ID is required" });

    const setting = await Setting.findOneAndUpdate(
      { key: "festivalTheme" },
      { value: theme },
      { upsert: true, new: true }
    );
    res.json({ ok: true, theme: setting.value, msg: `Store theme set to ${theme}` });
  } catch (error) {
    console.error("PUT /api/admin/theme error:", error);
    res.status(500).json({ ok: false, msg: "Failed to update store theme" });
  }
});

app.post("/api/admin/themes", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      id,
      tagline,
      announcement,
      badge,
      heroHeadline,
      heroSub,
      primaryColor,
      secondaryColor,
      accentColor,
      bgPage,
      gradientHero,
      icon,
      festiveTag
    } = req.body;

    if (!name || !primaryColor) {
      return res.status(400).json({ ok: false, msg: "Theme name and primary color are required" });
    }

    const themeId = (id || name.toLowerCase().replace(/[^a-z0-9]+/g, "_")).replace(/^_+|_+$/g, "") || ("theme_" + Date.now().toString(36));

    const newTheme = {
      id: themeId,
      name,
      tagline: tagline || `🎉 ${name} Exclusive Festival Deals`,
      announcement: announcement || `🎉 ${name} is LIVE! Grab mega savings & instant doorstep delivery!`,
      badge: badge || `✨ ${name}`,
      heroHeadline: heroHeadline || `${name} | Mega Savings`,
      heroSub: heroSub || "Enjoy exclusive discounts, fast 10-minute delivery & verified quality.",
      primaryColor: primaryColor || "#2563eb",
      secondaryColor: secondaryColor || "#f59e0b",
      accentColor: accentColor || "#10b981",
      bgPage: bgPage || "#fdfaf6",
      gradientHero: gradientHero || `linear-gradient(135deg, ${primaryColor} 0%, #1e293b 100%)`,
      icon: icon || "🎉",
      festiveTag: festiveTag || `${name} Special`,
      isCustom: true,
      createdAt: new Date()
    };

    let customThemesSetting = await Setting.findOne({ key: "customThemes" });
    let themesList = customThemesSetting ? (customThemesSetting.value || []) : [];

    // Replace if exists, else append
    const existingIdx = themesList.findIndex(t => t.id === themeId);
    if (existingIdx > -1) {
      themesList[existingIdx] = newTheme;
    } else {
      themesList.push(newTheme);
    }

    await Setting.findOneAndUpdate(
      { key: "customThemes" },
      { value: themesList },
      { upsert: true, new: true }
    );

    res.json({ ok: true, theme: newTheme, customThemes: themesList, msg: `Theme "${name}" saved successfully!` });
  } catch (error) {
    console.error("POST /api/admin/themes error:", error);
    res.status(500).json({ ok: false, msg: "Failed to create custom theme" });
  }
});

app.delete("/api/admin/themes/:id", requireAdmin, async (req, res) => {
  try {
    const targetId = req.params.id;
    let customThemesSetting = await Setting.findOne({ key: "customThemes" });
    let themesList = customThemesSetting ? (customThemesSetting.value || []) : [];

    const updatedList = themesList.filter(t => t.id !== targetId);

    await Setting.findOneAndUpdate(
      { key: "customThemes" },
      { value: updatedList },
      { upsert: true, new: true }
    );

    // If active theme was deleted, reset to default
    const activeSetting = await Setting.findOne({ key: "festivalTheme" });
    let currentActive = activeSetting ? activeSetting.value : "default";
    if (currentActive === targetId) {
      await Setting.findOneAndUpdate({ key: "festivalTheme" }, { value: "default" });
      currentActive = "default";
    }

    res.json({ ok: true, activeTheme: currentActive, customThemes: updatedList, msg: "Custom theme removed" });
  } catch (error) {
    console.error("DELETE /api/admin/themes/:id error:", error);
    res.status(500).json({ ok: false, msg: "Failed to remove custom theme" });
  }
});

// -------------------- PUBLIC ORDER TRACKING (NO LOGIN REQUIRED) --------------------
app.get("/api/orders/track/:query", async (req, res) => {
  try {
    const rawQuery = (req.params.query || "").trim();
    if (!rawQuery) {
      return res.json({ ok: false, msg: "Please provide a valid Order ID or Tracking ID" });
    }

    let order = null;

    // 1. Try finding by Mongo ObjectId
    if (mongoose.Types.ObjectId.isValid(rawQuery)) {
      order = await Order.findById(rawQuery)
        .select("-__v")
        .populate("userId", "email phone")
        .lean();
    }

    // 2. Try exact trackingId match
    if (!order) {
      order = await Order.findOne({ trackingId: rawQuery })
        .select("-__v")
        .populate("userId", "email phone")
        .lean();
    }

    // 3. Try case-insensitive trackingId match
    if (!order) {
      order = await Order.findOne({ trackingId: { $regex: new RegExp(`^${rawQuery}$`, "i") } })
        .select("-__v")
        .populate("userId", "email phone")
        .lean();
    }

    // 4. Try suffix match if user entered just numbers or last few chars
    if (!order && rawQuery.length >= 4) {
      const recentOrders = await Order.find({})
        .select("-__v")
        .populate("userId", "email phone")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

      order = recentOrders.find(o => {
        const idStr = o._id.toString();
        const trkStr = (o.trackingId || "").toUpperCase();
        const qUpper = rawQuery.toUpperCase();
        return idStr.endsWith(rawQuery) || trkStr === qUpper || trkStr.endsWith(qUpper) || (o.paymentId && o.paymentId === rawQuery);
      });
    }

    if (!order) {
      return res.json({ ok: false, msg: "No order found matching this Tracking ID or Order ID." });
    }

    const sanitizedOrder = {
      ...order,
      trackingId: order.trackingId || ('QC-TRK-' + order._id.toString().slice(-6)),
      customerName: order.address?.name || order.userId?.email?.split('@')[0] || 'Customer'
    };

    res.json({ ok: true, order: sanitizedOrder });
  } catch (error) {
    console.error("GET /api/orders/track/:query error:", error);
    res.json({ ok: false, msg: "Failed to look up order tracking details" });
  }
});

// -------------------- USER WALLET DETAILS --------------------
app.get("/api/user/wallet", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ ok: false, msg: "User not found" });

    refreshUserWallet(user);
    await user.save();

    const now = new Date();
    const activeGrants = (user.walletGrants || [])
      .filter(g => !g.isRevoked && new Date(g.expiresAt) > now && g.amount > 0)
      .map(g => {
        const msRemaining = new Date(g.expiresAt).getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
        return {
          id: g.id,
          amount: g.amount,
          originalAmount: g.originalAmount,
          reason: g.reason,
          source: g.source,
          expiresAt: g.expiresAt,
          daysRemaining
        };
      })
      .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));

    const pastGrants = (user.walletGrants || [])
      .filter(g => g.isRevoked || new Date(g.expiresAt) <= now || g.amount === 0)
      .map(g => ({
        id: g.id,
        amount: g.amount,
        originalAmount: g.originalAmount,
        reason: g.reason,
        expiresAt: g.expiresAt,
        isRevoked: Boolean(g.isRevoked),
        revokedReason: g.revokedReason || "",
        revokedAt: g.revokedAt,
        isExpired: new Date(g.expiresAt) <= now
      }))
      .slice(-15);

    res.json({
      ok: true,
      freeCash: user.freeCash,
      activeGrants,
      pastGrants
    });
  } catch (error) {
    console.error("GET /api/user/wallet error:", error);
    res.json({ ok: false, msg: "Failed to fetch wallet details" });
  }
});

// -------------------- ADMIN: USER FILTERING & CRITERIA --------------------
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const { search, criteria } = req.query;

    const users = await User.find({}).select("-passwordHash -__v").lean();
    const orders = await Order.find({}).select("userId total status createdAt").lean();

    // Map order stats per user
    const orderMap = {};
    for (const o of orders) {
      const uId = o.userId?.toString();
      if (!uId) continue;
      if (!orderMap[uId]) {
        orderMap[uId] = { count: 0, totalSpent: 0, lastOrderDate: null };
      }
      orderMap[uId].count += 1;
      if (o.status !== "cancelled") {
        orderMap[uId].totalSpent += Number(o.total || 0);
      }
      if (!orderMap[uId].lastOrderDate || new Date(o.createdAt) > new Date(orderMap[uId].lastOrderDate)) {
        orderMap[uId].lastOrderDate = o.createdAt;
      }
    }

    const now = new Date();

    let enriched = users.map(u => {
      const uId = u._id.toString();
      const stats = orderMap[uId] || { count: 0, totalSpent: 0, lastOrderDate: null };

      // Calculate active grants
      const grants = u.walletGrants || [];
      const activeGrants = grants.filter(g => new Date(g.expiresAt) > now && g.amount > 0);
      const activeBalance = activeGrants.reduce((s, g) => s + g.amount, 0);

      return {
        _id: u._id,
        email: u.email,
        phone: u.phone || "",
        createdAt: u.createdAt,
        freeCash: activeGrants.length > 0 ? activeBalance : (u.freeCash || 0),
        activeGrantsCount: activeGrants.length,
        walletGrants: grants,
        totalOrders: stats.count,
        totalSpent: Math.round(stats.totalSpent),
        lastOrderDate: stats.lastOrderDate
      };
    });

    // Apply search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(u =>
        u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q))
      );
    }

    // Apply criteria filters
    if (criteria === "no_orders") {
      enriched = enriched.filter(u => u.totalOrders === 0);
    } else if (criteria === "has_orders") {
      enriched = enriched.filter(u => u.totalOrders > 0);
    } else if (criteria === "vip") {
      enriched = enriched.filter(u => u.totalSpent >= 1000 || u.totalOrders >= 3);
    } else if (criteria === "inactive") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      enriched = enriched.filter(u => !u.lastOrderDate || new Date(u.lastOrderDate) < sevenDaysAgo);
    }

    res.json({ ok: true, users: enriched });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    res.json({ ok: false, msg: "Failed to fetch users" });
  }
});

// -------------------- ADMIN: FREE CASH AIRDROP WITH EXPIRY --------------------
app.post("/api/admin/wallet/airdrop", requireAdmin, async (req, res) => {
  try {
    const {
      userIds,
      isRandom,
      minAmount,
      maxAmount,
      fixedAmount,
      expiryDays,
      expiryDate,
      reason
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ ok: false, msg: "Please select at least one eligible user" });
    }

    const min = Math.max(1, Number(minAmount) || 50);
    const max = Math.max(min, Number(maxAmount) || 200);
    const fixed = Math.max(1, Number(fixedAmount) || 100);

    // Calculate expiry timestamp
    let expDate = null;
    if (expiryDate) {
      expDate = new Date(expiryDate);
    } else {
      const days = Number(expiryDays) || 7;
      expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
    }

    const now = new Date();
    if (expDate <= now) {
      return res.status(400).json({ ok: false, msg: "Expiry date must be in the future" });
    }

    const campaignReason = (reason || "Promotional Free Cash Gift").trim();
    let totalDistributed = 0;
    const distributionLog = [];

    const users = await User.find({ _id: { $in: userIds } });

    for (const user of users) {
      refreshUserWallet(user);

      // Determine amount (random between min-max or fixed)
      const grantAmount = isRandom
        ? Math.floor(Math.random() * (max - min + 1)) + min
        : fixed;

      const grant = {
        id: "wgrant_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
        amount: grantAmount,
        originalAmount: grantAmount,
        reason: campaignReason,
        source: "admin_airdrop",
        expiresAt: expDate,
        createdAt: new Date()
      };

      if (!user.walletGrants) user.walletGrants = [];
      user.walletGrants.push(grant);
      refreshUserWallet(user);

      await user.save();

      totalDistributed += grantAmount;
      distributionLog.push({
        userId: user._id,
        email: user.email,
        amount: grantAmount,
        newBalance: user.freeCash,
        expiresAt: expDate
      });
    }

    res.json({
      ok: true,
      msg: `🎉 Successfully credited ₹${totalDistributed} Free Cash to ${users.length} user(s)!`,
      count: users.length,
      totalDistributed,
      expiryDate: expDate,
      details: distributionLog
    });
  } catch (error) {
    console.error("POST /api/admin/wallet/airdrop error:", error);
    res.status(500).json({ ok: false, msg: "Failed to distribute Free Cash airdrop" });
  }
});

// -------------------- ADMIN: CUSTOMER MANAGEMENT 360 & REFUNDS --------------------

// List all customers with directory stats, refund status counts & incident metrics
app.get("/api/admin/customers", requireAdmin, async (req, res) => {
  try {
    const { search, filter } = req.query;

    const users = await User.find({}).select("-passwordHash -__v").lean();
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    const incidents = await Incident.find({}).sort({ createdAt: -1 }).lean();

    // Map orders by userId
    const userOrdersMap = {};
    for (const o of orders) {
      const uId = o.userId?.toString();
      if (!uId) continue;
      if (!userOrdersMap[uId]) userOrdersMap[uId] = [];
      userOrdersMap[uId].push(o);
    }

    // Map incidents by userId
    const userIncidentsMap = {};
    for (const inc of incidents) {
      const uId = inc.userId?.toString();
      if (!uId) continue;
      if (!userIncidentsMap[uId]) userIncidentsMap[uId] = [];
      userIncidentsMap[uId].push(inc);
    }

    const now = new Date();

    let enriched = users.map(u => {
      const uId = u._id.toString();
      const userOrders = userOrdersMap[uId] || [];
      const userIncidents = userIncidentsMap[uId] || [];

      // Calculate active unrevoked grants
      const grants = u.walletGrants || [];
      const activeGrants = grants.filter(g => !g.isRevoked && new Date(g.expiresAt) > now && g.amount > 0);
      const activeBalance = activeGrants.reduce((s, g) => s + g.amount, 0);

      const totalSpent = userOrders
        .filter(o => o.status !== "cancelled")
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      const pendingRefunds = userOrders.filter(o => o.refundStatus === "pending");
      const processedRefunds = userOrders.filter(o => o.refundStatus === "processed");
      const creditedRefunds = userOrders.filter(o => o.refundStatus === "credited");

      const openIncidents = userIncidents.filter(inc => inc.status === "open" || inc.status === "in_progress");

      return {
        _id: u._id,
        email: u.email,
        phone: u.phone || "",
        createdAt: u.createdAt,
        addresses: u.addresses || [],
        savedPaymentMethods: u.savedPaymentMethods || [],
        giftCardBalance: activeGrants.length > 0 ? activeBalance : (u.freeCash || 0),
        activeGrantsCount: activeGrants.length,
        walletGrants: grants,
        totalOrders: userOrders.length,
        totalSpent: Math.round(totalSpent),
        lastOrderDate: userOrders.length > 0 ? userOrders[0].createdAt : null,
        refundStats: {
          pending: pendingRefunds.length,
          processed: processedRefunds.length,
          credited: creditedRefunds.length,
          total: pendingRefunds.length + processedRefunds.length + creditedRefunds.length
        },
        incidentStats: {
          open: openIncidents.length,
          total: userIncidents.length
        }
      };
    });

    // Apply search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(u =>
        u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q))
      );
    }

    // Apply criteria filters
    if (filter === "pending_refunds") {
      enriched = enriched.filter(u => u.refundStats.pending > 0);
    } else if (filter === "has_incidents") {
      enriched = enriched.filter(u => u.incidentStats.open > 0);
    } else if (filter === "vip") {
      enriched = enriched.filter(u => u.totalSpent >= 1000 || u.totalOrders >= 3);
    } else if (filter === "has_orders") {
      enriched = enriched.filter(u => u.totalOrders > 0);
    } else if (filter === "no_orders") {
      enriched = enriched.filter(u => u.totalOrders === 0);
    }

    res.json({ ok: true, customers: enriched });
  } catch (error) {
    console.error("GET /api/admin/customers error:", error);
    res.json({ ok: false, msg: "Failed to fetch customer directory" });
  }
});

// Single Customer Detailed 360 View
app.get("/api/admin/customers/:id", requireAdmin, async (req, res) => {
  try {
    const customerId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ ok: false, msg: "Invalid customer ID" });
    }

    const user = await User.findById(customerId).select("-passwordHash -__v");
    if (!user) return res.status(404).json({ ok: false, msg: "Customer not found" });

    refreshUserWallet(user);
    await user.save();

    const orders = await Order.find({ userId: customerId }).sort({ createdAt: -1 }).lean();
    const incidents = await Incident.find({ userId: customerId }).sort({ createdAt: -1 }).lean();

    const now = new Date();
    const activeGrants = (user.walletGrants || []).filter(g => !g.isRevoked && new Date(g.expiresAt) > now && g.amount > 0);
    const pastGrants = (user.walletGrants || []).filter(g => g.isRevoked || new Date(g.expiresAt) <= now || g.amount === 0);

    const pendingRefunds = orders.filter(o => o.refundStatus === "pending");
    const processedRefunds = orders.filter(o => o.refundStatus === "processed");
    const creditedRefunds = orders.filter(o => o.refundStatus === "credited");

    res.json({
      ok: true,
      customer: {
        _id: user._id,
        email: user.email,
        phone: user.phone || "",
        createdAt: user.createdAt,
        addresses: user.addresses || [],
        savedPaymentMethods: user.savedPaymentMethods || [],
        giftCardBalance: user.freeCash,
        activeGrants,
        pastGrants
      },
      orders,
      incidents,
      refundSummary: {
        pendingCount: pendingRefunds.length,
        pendingAmount: pendingRefunds.reduce((s, o) => s + (o.refundAmount || o.total || 0), 0),
        processedCount: processedRefunds.length,
        creditedCount: creditedRefunds.length,
        creditedAmount: creditedRefunds.reduce((s, o) => s + (o.refundAmount || 0), 0)
      }
    });
  } catch (error) {
    console.error("GET /api/admin/customers/:id error:", error);
    res.status(500).json({ ok: false, msg: "Failed to fetch customer 360 profile" });
  }
});

// Update Order Refund Status (pending, processed, credited)
app.put("/api/admin/orders/:id/refund", requireAdmin, async (req, res) => {
  try {
    const { refundStatus, refundAmount, refundMethod, refundReason, refundRemarks } = req.body;
    const allowed = ["none", "pending", "processed", "credited"];
    if (!allowed.includes(refundStatus)) {
      return res.status(400).json({ ok: false, msg: "Invalid refund status value" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, msg: "Order not found" });

    const prevStatus = order.refundStatus || "none";
    const amount = Number(refundAmount) > 0 ? Number(refundAmount) : (order.total || 0);
    const method = refundMethod || "gift_card";

    order.refundStatus = refundStatus;
    order.refundAmount = amount;
    order.refundMethod = method;
    if (refundReason) order.refundReason = refundReason;
    if (refundRemarks) order.refundRemarks = refundRemarks;

    if (refundStatus === "processed" && !order.refundProcessedAt) {
      order.refundProcessedAt = new Date();
    }

    let walletCredited = false;
    let newWalletBalance = null;

    // If changing to 'credited' and not previously credited
    if (refundStatus === "credited") {
      if (!order.refundCreditedAt) order.refundCreditedAt = new Date();

      if (prevStatus !== "credited" && method === "gift_card" && order.userId) {
        const user = await User.findById(order.userId);
        if (user) {
          refundUserFreeCash(
            user,
            amount,
            `Refund for Order #${order._id.toString().slice(-6)}${refundReason ? ': ' + refundReason : ''}`
          );
          await user.save();
          walletCredited = true;
          newWalletBalance = user.freeCash;
        }
      }
    }

    await order.save();

    res.json({
      ok: true,
      order,
      walletCredited,
      newWalletBalance,
      msg: `Refund status updated to "${refundStatus.toUpperCase()}"!${walletCredited ? ` ₹${amount} credited to customer Gift Card balance.` : ''}`
    });
  } catch (error) {
    console.error("PUT /api/admin/orders/:id/refund error:", error);
    res.status(500).json({ ok: false, msg: "Failed to update refund status" });
  }
});

// Admin Gift Card Top-up / Adjustment directly for customer
app.post("/api/admin/customers/:id/giftcard-topup", requireAdmin, async (req, res) => {
  try {
    const { amount, reason, expiryDays } = req.body;
    const addAmt = Number(amount);
    if (!addAmt || addAmt <= 0) {
      return res.status(400).json({ ok: false, msg: "Valid credit amount is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ ok: false, msg: "Customer not found" });

    const days = Number(expiryDays) || 30;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + days);

    if (!user.walletGrants) user.walletGrants = [];
    user.walletGrants.push({
      id: "wgrant_admin_" + Date.now().toString(36),
      amount: addAmt,
      originalAmount: addAmt,
      reason: (reason || "Admin Customer Service Grant").trim(),
      source: "gift_card",
      expiresAt: expDate,
      createdAt: new Date()
    });

    refreshUserWallet(user);
    await user.save();

    res.json({
      ok: true,
      giftCardBalance: user.freeCash,
      walletGrants: user.walletGrants,
      msg: `🎉 Credited ₹${addAmt} to ${user.email}'s Gift Card balance!`
    });
  } catch (error) {
    console.error("POST /api/admin/customers/:id/giftcard-topup error:", error);
    res.status(500).json({ ok: false, msg: "Failed to top up customer balance" });
  }
});

// Admin Revoke Promotional Credits / Gift Card Balance from Customer
app.post("/api/admin/customers/:id/giftcard-revoke", requireAdmin, async (req, res) => {
  try {
    const { amount, reason, revokeAll } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ ok: false, msg: "Customer not found" });

    refreshUserWallet(user);
    if (!user.freeCash || user.freeCash <= 0) {
      return res.status(400).json({
        ok: false,
        msg: "Customer has no active promotional or gift card credits to revoke."
      });
    }

    const revokeReason = (reason || "Administrative Revocation").trim();
    let toRevoke = revokeAll ? null : Number(amount);
    if (!revokeAll && (!toRevoke || toRevoke <= 0)) {
      return res.status(400).json({
        ok: false,
        msg: "Please enter a valid amount to revoke or select 'Revoke Entire Balance'."
      });
    }

    const actuallyRevoked = revokeUserFreeCash(user, toRevoke, revokeReason);
    await user.save();

    res.json({
      ok: true,
      revokedAmount: actuallyRevoked,
      giftCardBalance: user.freeCash,
      walletGrants: user.walletGrants,
      msg: `⚠️ Revoked ₹${actuallyRevoked} credits from ${user.email}. Remaining active balance: ₹${user.freeCash}.`
    });
  } catch (error) {
    console.error("POST /api/admin/customers/:id/giftcard-revoke error:", error);
    res.status(500).json({ ok: false, msg: "Failed to revoke customer credits" });
  }
});

// Admin Revoke a Specific Individual Grant by ID
app.post("/api/admin/customers/:id/grants/:grantId/revoke", requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ ok: false, msg: "Customer not found" });

    const grant = (user.walletGrants || []).find(g => g.id === req.params.grantId);
    if (!grant) return res.status(404).json({ ok: false, msg: "Grant not found" });
    if (grant.isRevoked || grant.amount <= 0) {
      return res.status(400).json({ ok: false, msg: "This grant is already revoked or empty" });
    }

    const revokedAmt = grant.amount;
    grant.amount = 0;
    grant.isRevoked = true;
    grant.revokedReason = (reason || "Admin Grant Cancellation").trim();
    grant.revokedAt = new Date();

    refreshUserWallet(user);
    await user.save();

    res.json({
      ok: true,
      revokedAmount: revokedAmt,
      giftCardBalance: user.freeCash,
      walletGrants: user.walletGrants,
      msg: `Grant ${grant.id} (₹${revokedAmt}) was revoked successfully.`
    });
  } catch (error) {
    console.error("POST /api/admin/customers/:id/grants/:grantId/revoke error:", error);
    res.status(500).json({ ok: false, msg: "Failed to revoke grant" });
  }
});

// -------------------- ADMIN: GIFT CARDS MANAGEMENT --------------------

// List all gift cards with redemption analytics
app.get("/api/admin/giftcards", requireAdmin, async (req, res) => {
  try {
    const giftCards = await GiftCard.find().sort({ createdAt: -1 }).lean();
    res.json({ ok: true, giftCards });
  } catch (error) {
    console.error("GET /api/admin/giftcards error:", error);
    res.status(500).json({ ok: false, msg: "Failed to fetch gift cards" });
  }
});

// Create a new promotional gift card
app.post("/api/admin/giftcards", requireAdmin, async (req, res) => {
  try {
    const { code, title, amount, maxRedemptions, expiryDays } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ ok: false, msg: "Gift card voucher code is required" });
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ ok: false, msg: "Valid amount greater than ₹0 is required" });
    }

    const trimmedCode = code.trim().toUpperCase();
    const existing = await GiftCard.findOne({ code: trimmedCode });
    if (existing) {
      return res.status(400).json({ ok: false, msg: `Gift card code "${trimmedCode}" already exists` });
    }

    const days = Number(expiryDays) || 60;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const newCard = await GiftCard.create({
      code: trimmedCode,
      title: (title || "Promotional Gift Card").trim(),
      amount: amt,
      maxRedemptions: Number(maxRedemptions) || 1,
      expiresAt,
      isActive: true,
      createdBy: "admin"
    });

    res.json({
      ok: true,
      giftCard: newCard,
      msg: `🎉 Gift card "${trimmedCode}" (₹${amt}) created successfully!`
    });
  } catch (error) {
    console.error("POST /api/admin/giftcards error:", error);
    res.status(500).json({ ok: false, msg: "Failed to create gift card" });
  }
});

// Revoke / Deactivate an existing gift card code
app.put("/api/admin/giftcards/:id/revoke", requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const card = await GiftCard.findById(req.params.id);
    if (!card) return res.status(404).json({ ok: false, msg: "Gift card not found" });

    card.isActive = false;
    card.isRevoked = true;
    card.revokedReason = (reason || "Revoked by Administrator").trim();
    card.revokedAt = new Date();
    await card.save();

    res.json({
      ok: true,
      giftCard: card,
      msg: `Gift card "${card.code}" has been deactivated and revoked.`
    });
  } catch (error) {
    console.error("PUT /api/admin/giftcards/:id/revoke error:", error);
    res.status(500).json({ ok: false, msg: "Failed to revoke gift card" });
  }
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`✅ QuickCart Backend Running on Port ${PORT}`)
);
