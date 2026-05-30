// Hotel suggestions are embedded in trip data (hotelRecommendation field)
// This file provides helper functions to work with hotel data from trips

/**
 * Extract hotel recommendation from a trip object
 */
export const getHotelFromTrip = (trip) => {
  return trip?.hotelRecommendation || null;
};
