/**
 * Calculate the total budget usage of a trip dynamically.
 * @param {Object} trip - The trip object containing activities and hotel recommendation
 * @returns {Object} Budget statistics
 */
const calculateBudgetStats = (trip) => {
  const activities = trip.activities || [];
  const hotelRec = trip.hotelRecommendation || {};

  // Compute duration in days
  let durationDays = trip.totalDays || 1;
  if (trip.startDate && trip.endDate) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
  }

  // Calculate accommodation cost
  const hotelCost = (hotelRec.estimatedCostPerNight || 0) * durationDays;

  // Initialize category summaries
  let accommodation = hotelCost;
  let foodAndBeverage = 0;
  let activitiesAndEntranceFees = 0;
  let transportation = 0;
  let unforeseenExpenses = 0;

  // Process activities cost by category
  activities.forEach((act) => {
    const cost = act.cost || 0;
    const cat = (act.category || 'OTHER').toUpperCase();

    if (cat === 'HOTEL') {
      accommodation += cost;
    } else if (cat === 'FOOD') {
      foodAndBeverage += cost;
    } else if (cat === 'TRANSPORT') {
      transportation += cost;
    } else {
      // PLACE, REST, SHOPPING, OTHER
      activitiesAndEntranceFees += cost;
    }
  });

  const totalExpenses = accommodation + foodAndBeverage + activitiesAndEntranceFees + transportation + unforeseenExpenses;
  const remainingBudget = (trip.budget || 0) - totalExpenses;
  const isOverBudget = remainingBudget < 0;
  const percentageSpent = trip.budget > 0 ? (totalExpenses / trip.budget) * 100 : 0;

  return {
    totalBudget: trip.budget || 0,
    totalExpenses,
    remainingBudget,
    isOverBudget,
    percentageSpent: parseFloat(percentageSpent.toFixed(2)),
    categorySummary: {
      accommodation,
      foodAndBeverage,
      activitiesAndEntranceFees,
      transportation,
      unforeseenExpenses,
    },
  };
};

module.exports = {
  calculateBudgetStats,
};
