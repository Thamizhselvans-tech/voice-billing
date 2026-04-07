const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a professional GST invoice PDF
 * @param {Object} invoice - Invoice document from MongoDB
 * @returns {String} Path to generated PDF file
 */
async function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    // Ensure invoices directory exists
    const invoicesDir = path.join(__dirname, '..', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const filename = `${invoice.invoiceNumber}.pdf`;
    const filepath = path.join(invoicesDir, filename);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    const business = {
      name:    process.env.BUSINESS_NAME    || 'Smart Restaurant',
      address: process.env.BUSINESS_ADDRESS || '123 Main Street, Chennai',
      gstin:   process.env.BUSINESS_GSTIN   || '33AABCU9603R1ZX',
      phone:   process.env.BUSINESS_PHONE   || '+91-9876543210',
      email:   process.env.BUSINESS_EMAIL   || 'billing@restaurant.com'
    };

    const BLUE  = '#1F4E79';
    const LBLUE = '#2E75B6';
    const GRAY  = '#666666';
    const LGRAY = '#F5F5F5';
    const BLACK = '#000000';
    const W = 495; // Content width

    // ── Header Background ──────────────────────────────────────────────────
    doc.rect(50, 50, W, 90).fill(BLUE);

    // Business Name
    doc.fillColor('white').font('Helvetica-Bold').fontSize(22)
       .text(business.name, 60, 65, { width: W - 20 });

    // Business Details
    doc.font('Helvetica').fontSize(9).fillColor('#CCDDFF')
       .text(business.address, 60, 93)
       .text(`GSTIN: ${business.gstin}  |  Ph: ${business.phone}  |  ${business.email}`, 60, 106);

    // TAX INVOICE label
    doc.font('Helvetica-Bold').fontSize(11).fillColor('white')
       .text('TAX INVOICE', W - 30, 65, { align: 'right', width: 80 });

    // ── Invoice Meta Box ──────────────────────────────────────────────────
    doc.rect(50, 150, W, 65).fill(LGRAY);
    doc.rect(50, 150, W, 65).stroke('#CCCCCC');

    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(9);
    doc.text('INVOICE NUMBER',  60,  158);
    doc.text('DATE & TIME',     220, 158);
    doc.text('PAYMENT METHOD',  380, 158);

    doc.font('Helvetica').fontSize(11).fillColor(BLUE);
    doc.text(invoice.invoiceNumber, 60, 172);

    doc.fillColor(BLACK).fontSize(9);
    const dateStr = new Date(invoice.confirmedAt || invoice.createdAt)
      .toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit' });
    doc.text(dateStr, 220, 172);
    doc.text((invoice.paymentMethod || 'Cash').toUpperCase(), 380, 172);

    // ── Customer Info ─────────────────────────────────────────────────────
    let y = 228;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GRAY).text('BILL TO', 60, y);
    y += 14;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(BLACK)
       .text(invoice.customer.name || 'Walk-in Customer', 60, y);
    y += 14;
    doc.font('Helvetica').fontSize(9).fillColor(GRAY);
    if (invoice.customer.phone) doc.text(`Phone: ${invoice.customer.phone}`, 60, y), y += 12;
    if (invoice.customer.gstin) doc.text(`GSTIN: ${invoice.customer.gstin}`, 60, y), y += 12;

    // ── Items Table Header ────────────────────────────────────────────────
    y = Math.max(y + 10, 290);
    doc.rect(50, y, W, 22).fill(BLUE);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(9);

    const cols = { no: 55, name: 80, hsn: 265, qty: 315, rate: 360, gst: 410, total: 460 };
    doc.text('#',        cols.no,   y + 7);
    doc.text('ITEM',     cols.name, y + 7);
    doc.text('HSN',      cols.hsn,  y + 7);
    doc.text('QTY',      cols.qty,  y + 7);
    doc.text('RATE',     cols.rate, y + 7);
    doc.text('GST',      cols.gst,  y + 7);
    doc.text('AMOUNT',   cols.total,y + 7);
    y += 22;

    // ── Items Rows ────────────────────────────────────────────────────────
    invoice.items.forEach((item, idx) => {
      const rowBg = idx % 2 === 0 ? 'white' : '#F7FAFF';
      doc.rect(50, y, W, 20).fill(rowBg);
      doc.rect(50, y, W, 20).stroke('#E8E8E8');

      doc.fillColor(BLACK).font('Helvetica').fontSize(9);
      doc.text(String(idx + 1),            cols.no,   y + 6);
      doc.text(item.name,                  cols.name, y + 6, { width: 175, ellipsis: true });
      doc.text(item.hsnCode || '9963',     cols.hsn,  y + 6);
      doc.text(String(item.qty),           cols.qty,  y + 6);
      doc.text(`Rs.${item.price.toFixed(2)}`,  cols.rate, y + 6);
      doc.text(`${(item.gstRate * 100).toFixed(0)}%`, cols.gst, y + 6);
      doc.text(`Rs.${item.lineTotal.toFixed(2)}`, cols.total, y + 6);
      y += 20;
    });

    // ── Totals Section ────────────────────────────────────────────────────
    y += 10;
    doc.moveTo(50, y).lineTo(545, y).stroke('#CCCCCC');
    y += 10;

    const totalX = 380;
    const totalW = 155;

    const addTotalRow = (label, value, bold = false, color = BLACK) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 9)
         .fillColor(GRAY).text(label, totalX, y, { width: 90 });
      doc.fillColor(color).text(`Rs.${value.toFixed(2)}`, totalX + 90, y, { width: 65, align: 'right' });
      y += bold ? 18 : 14;
    };

    addTotalRow('Subtotal',    invoice.subtotal);
    if (invoice.isInterState) {
      addTotalRow('IGST',      invoice.igst || 0);
    } else {
      addTotalRow('CGST',      invoice.cgst || 0);
      addTotalRow('SGST',      invoice.sgst || 0);
    }
    addTotalRow('Total GST',   invoice.totalGst || 0);

    doc.moveTo(totalX, y).lineTo(545, y).stroke(LBLUE);
    y += 6;

    // Grand Total box
    doc.rect(totalX, y, totalW, 28).fill(BLUE);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(10)
       .text('GRAND TOTAL', totalX + 6, y + 8);
    doc.fontSize(11)
       .text(`Rs.${invoice.grandTotal.toFixed(2)}`, totalX + 6, y + 8, { width: totalW - 12, align: 'right' });
    y += 28;

    // ── GST Summary Table ─────────────────────────────────────────────────
    y += 20;
    if (y < 680) {
      doc.rect(50, y, W, 18).fill(LBLUE);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
      doc.text('GST SUMMARY', 60, y + 5);
      doc.text('TAXABLE AMOUNT', 180, y + 5);
      doc.text('CGST', 310, y + 5);
      doc.text('SGST', 370, y + 5);
      doc.text('TOTAL TAX', 430, y + 5);
      y += 18;

      doc.rect(50, y, W, 18).fill(LGRAY);
      doc.fillColor(BLACK).font('Helvetica').fontSize(9);
      doc.text(`${((invoice.cgst > 0 ? invoice.cgst / invoice.subtotal : 0) * 200).toFixed(0)}% GST`, 60, y + 5);
      doc.text(`Rs.${invoice.subtotal.toFixed(2)}`,    180, y + 5);
      doc.text(`Rs.${(invoice.cgst || 0).toFixed(2)}`, 310, y + 5);
      doc.text(`Rs.${(invoice.sgst || 0).toFixed(2)}`, 370, y + 5);
      doc.text(`Rs.${(invoice.totalGst || 0).toFixed(2)}`, 430, y + 5);
      y += 18;
    }

    // ── Footer ────────────────────────────────────────────────────────────
    const footerY = 770;
    doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#CCCCCC');
    doc.fillColor(GRAY).font('Helvetica').fontSize(8)
       .text('This is a computer-generated invoice and does not require a physical signature.', 50, footerY + 8, { align: 'center', width: W });
    doc.text(`Generated by Voice-Based Smart Billing System  |  ${new Date().toLocaleDateString('en-IN')}`, 50, footerY + 20, { align: 'center', width: W });

    doc.end();

    stream.on('finish', () => resolve(`/invoices/${filename}`));
    stream.on('error', reject);
  });
}

module.exports = { generateInvoicePDF };
