const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  productId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:       String,
  shortcut:   String,
  qty:        Number,
  unitPrice:  Number,
  gstRate:    Number,
  lineTotal:  Number
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  customer: {
    name:  { type: String, default: 'Walk-in Customer' },
    phone: { type: String, default: '' },
    gstin: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  items:      [InvoiceItemSchema],
  subtotal:   { type: Number, required: true },
  cgst:       { type: Number, default: 0 },
  sgst:       { type: Number, default: 0 },
  igst:       { type: Number, default: 0 },
  totalGst:   { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  isInterState: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ['cash','upi','card','credit'], default: 'cash' },
  status:     { type: String, enum: ['draft','confirmed','cancelled'], default: 'draft' },
  confirmedAt: Date,
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pdfPath:    String,
  voiceTranscript: String,
  notes:      String
}, { timestamps: true });

// Auto-generate invoice number before saving
InvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV-${yy}${mm}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
