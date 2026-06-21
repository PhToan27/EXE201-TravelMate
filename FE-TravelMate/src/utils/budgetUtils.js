import { formatVND, calcPercent } from './currencyUtils';

/**
 * Calculate budget statistics from a trip object (mirrors backend budgetService)
 */
export const calculateBudgetStats = (trip) => {
  if (!trip) return null;

  const activities = trip.activities || [];
  const budget = trip.budget || 0;

  // Sum expenses by category
  const byCategory = activities.reduce((acc, act) => {
    const cat = act.category || 'OTHER';
    acc[cat] = (acc[cat] || 0) + (act.cost || 0);
    return acc;
  }, {});

  const totalExpenses = activities.reduce((sum, act) => sum + (act.cost || 0), 0);
  const remainingBudget = budget - totalExpenses;

  return {
    totalExpenses,
    remainingBudget,
    usedPercent: calcPercent(totalExpenses, budget),
    byCategory,
  };
};

/**
 * Get budget breakdown data for charts
 */
export const getBudgetChartData = (trip) => {
  const stats = calculateBudgetStats(trip);
  if (!stats) return [];

  const categoryLabels = {
    FOOD: 'Ăn uống',
    PLACE: 'Tham quan',
    HOTEL: 'Nơi ở',
    TRANSPORT: 'Di chuyển',
    REST: 'Nghỉ ngơi',
    SHOPPING: 'Mua sắm',
    OTHER: 'Khác',
  };

  const categoryColors = {
    FOOD: '#F59E0B',
    PLACE: '#3B82F6',
    HOTEL: '#8B5CF6',
    TRANSPORT: '#10B981',
    REST: '#6B7280',
    SHOPPING: '#EC4899',
    OTHER: '#94A3B8',
  };

  return Object.entries(stats.byCategory)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: categoryLabels[key] || key,
      amount: value,
      color: categoryColors[key] || '#94A3B8',
      legendFontColor: '#334155',
      legendFontSize: 12,
    }));
};

/**
 * Get breakdown from trip's budgetBreakdown field (AI-generated)
 */
export const getAiBudgetBreakdown = (trip) => {
  if (!trip?.budgetBreakdown) return null;
  const bd = trip.budgetBreakdown;
  return [
    { label: 'Lưu trú', amount: bd.accommodation || 0, color: '#8B5CF6' },
    { label: 'Ăn uống', amount: bd.foodAndBeverage || 0, color: '#F59E0B' },
    { label: 'Tham quan', amount: bd.activitiesAndEntranceFees || 0, color: '#3B82F6' },
    { label: 'Di chuyển', amount: bd.transportation || 0, color: '#10B981' },
    { label: 'Dự phòng', amount: bd.unforeseenExpenses || 0, color: '#EF4444' },
  ].filter((item) => item.amount > 0);
};
