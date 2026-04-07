/**
 * GST Calculator Utility
 * Supports CGST+SGST (intra-state) and IGST (inter-state) modes
 */

/**
 * Calculate GST for a list of order items
 * @param {Array} items - Array of {name, qty, price, gstRate}
 * @param {Boolean} isInterState - true for IGST, false for CGST+SGST
 * @returns {Object} Complete billing breakdown
 */
function calculateBill(items, isInterState = false) {
  if (!items || items.length === 0) {
    throw new Error('No items provided for calculation');
  }

  let subtotal = 0;
  let totalGstAmount = 0;

  const processedItems = items.map(item => {
    const lineTotal = parseFloat((item.price * item.qty).toFixed(2));
    const gstRate = item.gstRate || 0.05;
    const gstAmount = parseFloat((lineTotal * gstRate).toFixed(2));

    subtotal += lineTotal;
    totalGstAmount += gstAmount;

    return {
      ...item,
      lineTotal,
      gstAmount,
      gstRate
    };
  });

  subtotal = parseFloat(subtotal.toFixed(2));
  totalGstAmount = parseFloat(totalGstAmount.toFixed(2));

  let cgst = 0, sgst = 0, igst = 0;

  if (isInterState) {
    igst = totalGstAmount;
  } else {
    cgst = parseFloat((totalGstAmount / 2).toFixed(2));
    sgst = parseFloat((totalGstAmount / 2).toFixed(2));
  }

  const grandTotal = parseFloat((subtotal + totalGstAmount).toFixed(2));

  return {
    items: processedItems,
    subtotal,
    cgst,
    sgst,
    igst,
    totalGst: totalGstAmount,
    grandTotal,
    isInterState,
    itemCount: items.reduce((sum, i) => sum + i.qty, 0)
  };
}

/**
 * Detect if transaction is inter-state using GSTIN state codes
 */
function isInterStateTransaction(customerGSTIN, businessGSTIN) {
  if (!customerGSTIN || customerGSTIN.length < 2) return false;
  if (!businessGSTIN || businessGSTIN.length < 2) return false;
  return customerGSTIN.substring(0, 2) !== businessGSTIN.substring(0, 2);
}

module.exports = { calculateBill, isInterStateTransaction };
