/**
 * Calculate the total budget usage of a trip dynamically.
 * @param {Object} trip - The trip object containing metadata
 * @param {Array} activities - Optional array of activities from Activity model
 * @param {Object} hotelRec - Optional hotel recommendation from HotelSuggestion model
 * @returns {Object} Budget statistics
 */
const calculateBudgetStats = (trip, activities, hotelRec) => {
  const acts = (activities && activities.length > 0) ? activities : (trip.activities || []);
  const hotel = (hotelRec && Object.keys(hotelRec).length > 0) ? hotelRec : (trip.hotelRecommendation || {});

  // Compute duration in days
  let durationDays = trip.totalDays || 1;
  if (trip.startDate && trip.endDate) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
  }

  // Calculate accommodation cost (handle both field names)
  const pricePerNight = hotel.pricePerNight !== undefined ? hotel.pricePerNight : (hotel.estimatedCostPerNight || 0);
  const hotelCost = pricePerNight * durationDays;

  // Initialize category summaries
  let accommodation = hotelCost;
  let foodAndBeverage = 0;
  let activitiesAndEntranceFees = 0;
  let transportation = 0;
  let unforeseenExpenses = 0;

  // Process activities cost by category
  acts.forEach((act) => {
    const cost = act.estimatedCost !== undefined ? act.estimatedCost : (act.cost || 0);
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
