const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// Core shortcut decoder
async function decodeTranscript(transcript) {
  // Normalize: lowercase, split by comma or whitespace
  const cleaned = transcript.toLowerCase().replace(/[.,!?]/g, ' ').trim();
  const tokens = cleaned.split(/[\s,]+/).filter(Boolean);

  const order = [];
  const unrecognized = [];
  let i = 0;

  while (i < tokens.length) {
    const code = tokens[i];
    // Look ahead for quantity (next token is a number)
    const nextIsNum = i + 1 < tokens.length && /^\d+$/.test(tokens[i + 1]);
    const qty = nextIsNum ? parseInt(tokens[i + 1]) : 1;

    const product = await Product.findOne({ shortcut: code, isActive: true });
    if (product) {
      order.push({
        productId: product._id,
        name: product.name,
        shortcut: code,
        qty,
        unitPrice: product.price,
        gstRate: product.gstRate,
        lineTotal: product.price * qty
      });
      i += nextIsNum ? 2 : 1;
    } else {
      // Not a product code — skip (might be filler words)
      if (!['and', 'the', 'a', 'please', 'add', 'give', 'me', 'with'].includes(code)) {
        unrecognized.push(code);
      }
      i += 1;
    }
  }

  return { order, unrecognized };
}

// POST /api/voice/decode
router.post('/decode', protect, async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ success: false, message: 'Transcript is required' });
    }
    const { order, unrecognized } = await decodeTranscript(transcript);
    res.json({ success: true, transcript, order, unrecognized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
