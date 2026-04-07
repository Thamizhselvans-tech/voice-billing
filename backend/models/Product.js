const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  shortcut: { type: String, required: true, unique: true, lowercase: true, trim: true },
  price:    { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  gstRate:  { type: Number, default: 0.18 },
  hsnCode:  { type: String, default: '' },
  unit:     { type: String, default: 'piece' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
