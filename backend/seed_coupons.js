import "dotenv/config";
import mongoose from "mongoose";
import Coupon from "./models/Coupon.js";

async function seedCoupons() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected");

    // Clear existing coupons to avoid unique key errors during testing
    await Coupon.deleteMany({});
    console.log("Cleared old coupons.");

    const coupons = [
      {
        code: "NEW100",
        discount: 90,
        maxDiscount: 200,
        minOrderVal: 499,
        validUpto: new Date("2030-12-31"), // Valid until end of 2030
        maxUsesPerUser: 1, // Can only be used 1 time per user
        isFirstOrderOnly: true, // Only applicable if user has 0 orders
        isActive: true
      },
      {
        code: "QUICK10",
        discount: 25,
        maxDiscount: 50,
        minOrderVal: 249,
        validUpto: new Date("2030-12-31"),
        maxUsesPerUser: 0, // 0 means unlimited uses per user
        isFirstOrderOnly: false,
        isActive: true
      },
      {
        code: "BIGSAVE",
        discount: 40,
        maxDiscount: 400,
        minOrderVal: 1499,
        validUpto: new Date("2030-12-31"),
        maxUsesPerUser: 1, // 0 means unlimited uses per user
        isFirstOrderOnly: false,
        isActive: true
      }
    ];

    console.log("Inserting new coupons...");
    await Coupon.insertMany(coupons);
    console.log("✅ Coupons added successfully!");

  } catch (err) {
    console.error("❌ Error adding coupons:", err);
  } finally {
    mongoose.connection.close();
    console.log("Disconnected from MongoDB.");
  }
}

seedCoupons();
