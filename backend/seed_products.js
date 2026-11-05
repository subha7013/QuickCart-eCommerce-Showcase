/**
 * seed_products.js
 * Run once to populate MongoDB with all product inventory data.
 * Usage: node backend/seed_products.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import Product from "./models/Product.js";

const PRODUCTS = [
  // ── Electronics ──
  { id: "c1",       name: "Dual Port Adapter",          category: "Electronics", subcategory: "Accessories", price: 199,  image: "/assets/charger1.jpg",  stock: 10 },
  { id: "c2",       name: "Samsung Adapter",             category: "Electronics", subcategory: "Accessories", price: 249,  image: "/assets/charger2.jpg",  stock: 5  },
  { id: "c3",       name: "Apple Adapter",               category: "Electronics", subcategory: "Accessories", price: 1499, image: "/assets/charger3.jpg",  stock: 3  },
  { id: "e1",       name: "Realme buds Q",               category: "Electronics", subcategory: "Headset",     price: 1999, image: "/assets/earbuds1.jpg",  stock: 8  },
  { id: "e2",       name: "Boult earbuds",               category: "Electronics", subcategory: "Headset",     price: 899,  image: "/assets/earbuds2.jpg",  stock: 15 },
  { id: "e3",       name: "earbuds",                     category: "Electronics", subcategory: "Headset",     price: 1299, image: "/assets/earbuds3.jpg",  stock: 12 },
  { id: "h1",       name: "Headset",                     category: "Electronics", subcategory: "Headset",     price: 2599, image: "/assets/headset1.jpg",  stock: 10 },
  { id: "h2",       name: "Headset",                     category: "Electronics", subcategory: "Headset",     price: 7999, image: "/assets/headset2.jpg",  stock: 5  },
  { id: "m1",       name: "Nothing 3a Pro 6GB , 256 GB",                     category: "Electronics", subcategory: "Mobile",     price: 17999, image: "/assets/nothing.jpg",  stock: 3  },
  // ── Fashion ──
  { id: "fashion1", name: "Roadster Tshirt",             category: "Fashion",     subcategory: "Tshirts",     price: 599,  image: "/assets/Tshirts1.jpg",  stock: 20 },
  { id: "fashion2", name: "campus Running Shoes",        category: "Fashion",     subcategory: "Shoes",       price: 1499, image: "/assets/Shoes1.jpg",    stock: 10 },
  // ── Groceries ──
  { id: "grocery1",  name: "Fresh Potato (1000 g.)",     category: "Groceries",   subcategory: "Vegetables",  price: 20,   image: "/assets/potato.jpg",    stock: 50 },
  { id: "grocery2",  name: "Organic Tomato (500 g.)",    category: "Groceries",   subcategory: "Vegetables",  price: 30,   image: "/assets/tomato.jpg",    stock: 30 },
  { id: "grocery3",  name: "Organic Tomato (1000 g.)",   category: "Groceries",   subcategory: "Vegetables",  price: 50,   image: "/assets/tomato.jpg",    stock: 20 },
  { id: "grocery4",  name: "Organic Parwal (500 g.)",    category: "Groceries",   subcategory: "Vegetables",  price: 30,   image: "/assets/parwal.jpg",    stock: 25 },
  { id: "grocery5",  name: "Pumpkin (500 g.)",           category: "Groceries",   subcategory: "Vegetables",  price: 30,   image: "/assets/pumpkin.jpg",   stock: 20 },
  { id: "grocery6",  name: "Organic Green Chilli (100 g.)", category: "Groceries", subcategory: "Vegetables", price: 10,   image: "/assets/chilli1.jpg",   stock: 30 },
  { id: "grocery7",  name: "Bullet Chilli (100 g.)",     category: "Groceries",   subcategory: "Vegetables",  price: 15,   image: "/assets/chilli2.jpg",   stock: 25 },
  { id: "grocery8",  name: "Ginger (200 g.)",            category: "Groceries",   subcategory: "Vegetables",  price: 40,   image: "/assets/ginger.jpg",    stock: 20 },
  { id: "grocery9",  name: "Garlic (100 g.)",            category: "Groceries",   subcategory: "Vegetables",  price: 20,   image: "/assets/garlic.jpg",    stock: 10 },
  { id: "grocery10", name: "Brinjal (500 g.)",           category: "Groceries",   subcategory: "Vegetables",  price: 30,   image: "/assets/brinjal.jpg",   stock: 25 },
  { id: "fruits1",   name: "Daily Fresh Banana (500 g.)", category: "Groceries",  subcategory: "Fruits",      price: 30,   image: "/assets/banana.jpg",    stock: 30 },
  { id: "fruits2",   name: "Apple (250 g.)",             category: "Groceries",   subcategory: "Fruits",      price: 40,   image: "/assets/apple.jpg",     stock: 20 },

];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    let created = 0;
    let skipped = 0;

    for (const p of PRODUCTS) {
      const exists = await Product.findOne({ id: p.id });
      if (exists) {
        console.log(`  ⏭  Skipped (already exists): ${p.id} — ${p.name}`);
        skipped++;
      } else {
        await Product.create(p);
        console.log(`  ✅ Created: ${p.id} — ${p.name} (stock: ${p.stock})`);
        created++;
      }
    }

    console.log(`\n🌱 Seeding complete. Created: ${created}, Skipped: ${skipped}`);
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
