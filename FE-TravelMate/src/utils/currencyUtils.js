/**
 * Format number as Vietnamese currency (VND)
 * @param {number} amount
 * @returns {string}
 */
export const formatVND = (amount) => {
  if (amount === null || amount === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Parse VND string to number
 */
export const parseVND = (str) => {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
};

/**
 * Format compact currency (e.g. 5.000.000 → 5tr)
 */
export const formatCompact = (amount) => {
  if (!amount) return '0';
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}tr`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k`;
  }
  return `${amount}`;
};

/**
 * Calculate percentage
 */
export const calcPercent = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};
