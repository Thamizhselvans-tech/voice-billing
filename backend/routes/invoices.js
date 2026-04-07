const express = require('express');
const Invoice = require('../models/Invoice');
const { authenticate } = require('../middleware/auth');
const { calculateBill, isInterStateTransaction } = require('../utils/gstCalculator');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

const router = express.Router();

// POST /api/invoices/generate
// CRITICAL: Invoice is only created when confirmed === true
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { items, customer, paymentMethod, confirmed, voiceTranscript, isInterState } = req.body;

    // ─── HARD GATE: No invoice without confirmation ────────────────────────
    if (!confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Invoice cannot be generated without operator confirmation. Set confirmed: true to proceed.'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in the order' });
    }

    // Calculate final bill
    let interState = isInterState || false;
    if (customer && customer.gstin) {
      interState = isInterStateTransaction(customer.gstin, process.env.BUSINESS_GSTIN);
    }

    const bill = calculateBill(items, interState);

    // Build invoice document
    const invoiceData = {
      customer: customer || { name: 'Walk-in Customer' },
      items: bill.items.map(item => ({
        productId: item.productId,
        name:      item.name,
        shortcut:  item.shortcut,
        qty:       item.qty,
        price:     item.price,
        gstRate:   item.gstRate,
        hsnCode:   item.hsnCode || '9963',
        lineTotal: item.lineTotal,
        gstAmount: item.gstAmount
      })),
      subtotal:      bill.subtotal,
      cgst:          bill.cgst,
      sgst:          bill.sgst,
      igst:          bill.igst,
      totalGst:      bill.totalGst,
      grandTotal:    bill.grandTotal,
      isInterState:  interState,
      paymentMethod: paymentMethod || 'cash',
      status:        'confirmed',
      confirmed:     true,
      confirmedAt:   new Date(),
      createdBy:     req.user._id,
      voiceTranscript: voiceTranscript || ''
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    // Generate PDF
    const pdfPath = await generateInvoicePDF(invoice);
    invoice.pdfPath = pdfPath;
    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      invoice: {
        _id:           invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal:    invoice.grandTotal,
        pdfPath:       invoice.pdfPath,
        confirmedAt:   invoice.confirmedAt
      }
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/invoices — List all invoices
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, startDate, endDate } = req.query;
    const filter = { status: 'confirmed' };

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.confirmedAt = {};
      if (startDate) filter.confirmedAt.$gte = new Date(startDate);
      if (endDate) filter.confirmedAt.$lte = new Date(endDate + 'T23:59:59');
    }

    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .sort({ confirmedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-items');

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      invoices
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/invoices/:id — Get single invoice
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/invoices/:id — Cancel invoice
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, { status: 'cancelled' }, { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
