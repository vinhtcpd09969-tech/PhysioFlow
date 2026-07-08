/**
 * Currency and number formatting utilities for OfficeCare.
 */

/**
 * Format a number as Vietnamese currency (e.g. 150000 → "150.000đ")
 */
export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0đ';
  return `${num.toLocaleString('vi-VN')}đ`;
};

/**
 * Format a phone number for display (e.g. "0398655332" → "0398 655 332")
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Truncate a string to maxLength and add ellipsis.
 */
export const truncate = (str: string, maxLength: number): string => {
  if (!str || str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
};
