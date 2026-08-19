/**
 * Format numeric values to Indian Rupee (INR) currency format
 * Example: 125000 -> "₹1,25,000.00"
 *
 * @param {number|string} amount - The numerical amount to format
 * @returns {string} Formatted INR currency string
 */
export const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format date string or object to localized Indian Date format
 * Example: 2026-08-12 -> "12 Aug 2026"
 *
 * @param {string|Date} dateVal - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
