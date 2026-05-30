import { create } from 'zustand';
import { calculateBudgetStats, getBudgetChartData, getAiBudgetBreakdown } from '../../utils/budgetUtils';

const useBudgetStore = create((set) => ({
  stats: null,
  chartData: [],
  aiBreakdown: [],

  // Compute budget data from a trip
  computeFromTrip: (trip) => {
    if (!trip) {
      set({ stats: null, chartData: [], aiBreakdown: [] });
      return;
    }
    const stats = calculateBudgetStats(trip);
    const chartData = getBudgetChartData(trip);
    const aiBreakdown = getAiBudgetBreakdown(trip);
    set({ stats, chartData, aiBreakdown });
  },

  clear: () => set({ stats: null, chartData: [], aiBreakdown: [] }),
}));

export default useBudgetStore;
