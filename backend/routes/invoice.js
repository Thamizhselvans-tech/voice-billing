const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const { protect, adminOnly } = require('../middleware/auth');

// Ensure invoices directory exists
const invoicesDir = path.join(__dirname, '../invoices');
if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });

function generatePDF(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    const filepath = path.join(invoicesDir, filename);
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#1F4E79')
       .text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#555555')
       .text('Voice-Based Smart Billing System', { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2E75B6').lineWidth(2).stroke();
    doc.moveDown(0.5);

    // Invoice meta
    const y1 = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
       .text(`Invoice No: ${invoice.invoiceNumber}`, 50, y1);
    doc.font('Helvetica').fillColor('#333333')
       .text(`Date: ${new Date(invoice.confirmedAt || invoice.createdAt).toLocaleString('en-IN')}`, 350, y1, { align: 'right', width: 195 });
    doc.moveDown(0.5);

    // Customer details
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1F4E79').text('BILL TO:');
    doc.fontSize(10).font('Helvetica').fillColor('#333333')
       .text(invoice.customer.name || 'Walk-in Customer');
    if (invoice.customer.phone) doc.text(`Phone: ${invoice.customer.phone}`);
    if (invoice.customer.gstin) doc.text(`GSTIN: ${invoice.customer.gstin}`);
    doc.moveDown(0.5);

    // Items table header
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
    doc.moveDown(0.3);
    const th = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.rect(50, th - 4, 495, 18).fill('#1F4E79');
    doc.fillColor('#FFFFFF')
       .text('#',   55, th, { width: 20 })
       .text('Item',75, th, { width: 200 })
       .text('Qty', 275, th, { width: 50, align: 'center' })
       .text('Rate', 325, th, { width: 70, align: 'right' })
       .text('GST%',395, th, { width: 50, align: 'center' })
       .text('Total',445, th, { width: 95, align: 'right' });
    doc.moveDown(0.8);

    // Items
    invoice.items.forEach((item, idx) => {
      const iy = doc.y;
      if (idx % 2 === 0) doc.rect(50, iy - 3, 495, 16).fill('#F0F5FA');
      doc.fontSize(9).font('Helvetica').fillColor('#222222')
         .text(String(idx + 1), 55, iy, { width: 20 })
         .text(item.name, 75, iy, { width: 200 })
         .text(String(item.qty), 275, iy, { width: 50, align: 'center' })
         .text(`Rs.${item.unitPrice.toFixed(2)}`, 325, iy, { width: 70, align: 'right' })
         .text(`${(item.gstRate * 100).toFixed(0)}%`, 395, iy, { width: 50, align: 'center' })
         .text(`Rs.${item.lineTotal.toFixed(2)}`, 445, iy, { width: 95, align: 'right' });
      doc.moveDown(0.7);
    });

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    // Totals
    const tx = 350;
    const tw = 195;
    doc.fontSize(10).font('Helvetica').fillColor('#333333')
       .text(`Subtotal:`, tx, doc.y, { width: tw, align: 'right' });
    doc.text(`Rs.${invoice.subtotal.toFixed(2)}`, tx, doc.y - 13, { width: tw, align: 'right' });

    if (!invoice.isInterState) {
      doc.moveDown(0.4).text(`CGST:`, tx, doc.y, { width: tw, align: 'right' });
      doc.text(`Rs.${invoice.cgst.toFixed(2)}`, tx, doc.y - 13, { width: tw, align: 'right' });
      doc.moveDown(0.4).text(`SGST:`, tx, doc.y, { width: tw, align: 'right' });
      doc.text(`Rs.${invoice.sgst.toFixed(2)}`, tx, doc.y - 13, { width: tw, align: 'right' });
    } else {
      doc.moveDown(0.4).text(`IGST:`, tx, doc.y, { width: tw, align: 'right' });
      doc.text(`Rs.${invoice.igst.toFixed(2)}`, tx, doc.y - 13, { width: tw, align: 'right' });
    }

    doc.moveDown(0.5);
    doc.moveTo(350, doc.y).lineTo(545, doc.y).strokeColor('#1F4E79').lineWidth(1).stroke();
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F4E79')
       .text(`GRAND TOTAL: Rs.${invoice.grandTotal.toFixed(2)}`, tx, doc.y, { width: tw, align: 'right' });

    doc.moveDown(1);
    doc.fontSize(9).font('Helvetica').fillColor('#888888')
       .text(`Payment: ${invoice.paymentMethod.toUpperCase()}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text('Thank you for your business!', { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
}

// POST /api/invoice/generate — CONFIRMATION REQUIRED
router.post('/generate', protect, async (req, res) => {
  try {
    const { items, customer, subtotal, cgst, sgst, igst, totalGst, grandTotal,
            isInterState, paymentMethod, confirmed, voiceTranscript, notes } = req.body;

    // ⚠️ HARD GATE: No invoice without explicit confirmation
    if (!confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Invoice cannot be generated without operator confirmation.'
      });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in bill' });
    }

    const invoice = await Invoice.create({
      customer: customer || {},
      items, subtotal, cgst, sgst, igst, totalGst, grandTotal,
      isInterState, paymentMethod,
      status: 'confirmed',
      confirmedAt: new Date(),
      confirmedBy: req.user._id,
      voiceTranscript, notes
    });

    // Generate PDF
    const pdfFile = await generatePDF(invoice);
    invoice.pdfPath = pdfFile;
    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        pdfUrl: `/invoices/${pdfFile}`,
        confirmedAt: invoice.confirmedAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all invoices
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { status: 'confirmed' };
    if (search) query['invoiceNumber'] = { $regex: search, $options: 'i' };
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('confirmedBy', 'name');
    const total = await Invoice.countDocuments(query);
    res.json({ success: true, invoices, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single invoice
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('confirmedBy', 'name');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
