const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

function calculateBill(items, isInterState = false) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  let cgst = 0, sgst = 0, igst = 0;

  if (isInterState) {
    // IGST for inter-state
    items.forEach(item => { igst += item.lineTotal * item.gstRate; });
  } else {
    // CGST + SGST for intra-state (equal split)
    items.forEach(item => {
      cgst += item.lineTotal * (item.gstRate / 2);
      sgst += item.lineTotal * (item.gstRate / 2);
    });
  }

  const totalGst = cgst + sgst + igst;
  const grandTotal = subtotal + totalGst;

  return {
    subtotal:   parseFloat(subtotal.toFixed(2)),
    cgst:       parseFloat(cgst.toFixed(2)),
    sgst:       parseFloat(sgst.toFixed(2)),
    igst:       parseFloat(igst.toFixed(2)),
    totalGst:   parseFloat(totalGst.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
    isInterState
  };
}

// POST /api/bill/calculate
router.post('/calculate', protect, async (req, res) => {
  try {
    const { items, isInterState = false } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }
    const bill = calculateBill(items, isInterState);
    res.json({ success: true, items, ...bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
