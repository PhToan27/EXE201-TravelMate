import { format, parseISO, differenceInDays, addDays, isValid } from 'date-fns';

/**
 * Format date to Vietnamese readable format
 * @param {string|Date} date
 * @param {string} formatStr
 * @returns {string}
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
  } catch {
    return '';
  }
};

/**
 * Format date range (e.g. "01/06 - 03/06/2026")
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  const start = formatDate(startDate, 'dd/MM');
  const end = formatDate(endDate, 'dd/MM/yyyy');
  return `${start} - ${end}`;
};

/**
 * Calculate number of days between two dates
 */
export const getDayCount = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    return Math.max(1, differenceInDays(end, start));
  } catch {
    return 0;
  }
};

/**
 * Get array of dates between start and end
 */
export const getDatesBetween = (startDate, endDate) => {
  const days = getDayCount(startDate, endDate);
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  return Array.from({ length: days }, (_, i) => addDays(start, i));
};

/**
 * Format time string (e.g. "08:00 AM")
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr;
};

/**
 * Check if a date is in the past
 */
export const isPast = (date) => {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d < new Date();
};

/**
 * Get relative label for a trip
 */
export const getTripTimeLabel = (startDate, endDate) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  const now = new Date();

  if (now < start) {
    const days = differenceInDays(start, now);
    return `Còn ${days} ngày`;
  } else if (now >= start && now <= end) {
    return 'Đang diễn ra';
  } else {
    return 'Đã kết thúc';
  }
};
