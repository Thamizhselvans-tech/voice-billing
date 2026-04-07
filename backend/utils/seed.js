const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Product = require('../models/Product');

const products = [
  { name: 'Biryani',              shortcut: 'bn',    price: 120, category: 'Main Course', gstRate: 0.05 },
  { name: 'Chicken Curry',        shortcut: 'ch',    price: 150, category: 'Main Course', gstRate: 0.05 },
  { name: 'Paneer Butter Masala', shortcut: 'pbm',   price: 160, category: 'Main Course', gstRate: 0.05 },
  { name: 'Dal Tadka',            shortcut: 'dal',   price: 80,  category: 'Main Course', gstRate: 0.05 },
  { name: 'Butter Roti',          shortcut: 'roti',  price: 20,  category: 'Breads',      gstRate: 0.05 },
  { name: 'Naan',                 shortcut: 'naan',  price: 30,  category: 'Breads',      gstRate: 0.05 },
  { name: 'Lassi',                shortcut: 'lsi',   price: 40,  category: 'Beverages',   gstRate: 0.12 },
  { name: 'Mineral Water 500ml',  shortcut: 'wtr',   price: 20,  category: 'Beverages',   gstRate: 0.12 },
  { name: 'Mango Juice',          shortcut: 'mj',    price: 60,  category: 'Beverages',   gstRate: 0.12 },
  { name: 'Coca Cola 300ml',      shortcut: 'coke',  price: 40,  category: 'Beverages',   gstRate: 0.12 },
  { name: 'Steamed Rice',         shortcut: 'rice',  price: 50,  category: 'Sides',       gstRate: 0.05 },
  { name: 'Raita',                shortcut: 'raita', price: 30,  category: 'Sides',       gstRate: 0.05 },
  { name: 'Gulab Jamun',          shortcut: 'gj',    price: 50,  category: 'Desserts',    gstRate: 0.05 },
  { name: 'Ice Cream',            shortcut: 'ic',    price: 60,  category: 'Desserts',    gstRate: 0.05 },
  { name: 'Veg Thali',            shortcut: 'vt',    price: 180, category: 'Thali',       gstRate: 0.05 },
  { name: 'Non-Veg Thali',        shortcut: 'nvt',   price: 220, category: 'Thali',       gstRate: 0.05 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voice_billing');
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Product.deleteMany({});

  await User.create([
    { name: 'Admin User', email: 'admin@billing.com', password: 'admin123', role: 'admin' },
    { name: 'Billing Operator', email: 'operator@billing.com', password: 'operator123', role: 'operator' }
  ]);
  console.log('✅ Users seeded');

  await Product.insertMany(products);
  console.log(`✅ ${products.length} products seeded`);
  console.log('\n📋 Login credentials:');
  console.log('  Admin:    admin@billing.com / admin123');
  console.log('  Operator: operator@billing.com / operator123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
