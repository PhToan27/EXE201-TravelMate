import { useEffect } from 'react';
import useBudgetStore from '../store/budget/budgetStore';

/**
 * useBudget hook — computes budget data from a trip
 */
const useBudget = (trip) => {
  const stats = useBudgetStore((s) => s.stats);
  const chartData = useBudgetStore((s) => s.chartData);
  const aiBreakdown = useBudgetStore((s) => s.aiBreakdown);
  const computeFromTrip = useBudgetStore((s) => s.computeFromTrip);

  useEffect(() => {
    computeFromTrip(trip);
  }, [trip]);

  return { stats, chartData, aiBreakdown };
};

export default useBudget;
