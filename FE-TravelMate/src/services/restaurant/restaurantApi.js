// Restaurant suggestions are embedded in trip data (restaurantRecommendations field)

/**
 * Extract restaurant recommendations from a trip object
 */
export const getRestaurantsFromTrip = (trip) => {
  return trip?.restaurantRecommendations || [];
};
