const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayStats, monthStats, totalInvoices, recent] = await Promise.all([
      Invoice.aggregate([
        { $match: { status: 'confirmed', confirmedAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { status: 'confirmed', confirmedAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
      ]),
      Invoice.countDocuments({ status: 'confirmed' }),
      Invoice.find({ status: 'confirmed' }).sort({ createdAt: -1 }).limit(5).select('invoiceNumber grandTotal customer confirmedAt')
    ]);

    res.json({
      success: true,
      todayRevenue: todayStats[0]?.total || 0,
      todayInvoices: todayStats[0]?.count || 0,
      monthRevenue: monthStats[0]?.total || 0,
      monthInvoices: monthStats[0]?.count || 0,
      totalInvoices,
      recentInvoices: recent
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
