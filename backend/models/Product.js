import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // matches frontend product id (e.g. "c1", "grocery1")
  name: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: "" },
  price: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  image: { type: String, default: "" },
  stock: { type: Number, required: true, default: 0, min: 0 },
  limitPerOrder: { type: Number, default: 0, min: 0 },
  offerTag: { type: String, default: "" }, // e.g., "Deal of the Day", "Festive Pick", "Bestseller", "40% OFF"
  discountPercent: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  rating: { type: Number, default: 4.4 },
  ratingsCount: { type: Number, default: 142 }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
