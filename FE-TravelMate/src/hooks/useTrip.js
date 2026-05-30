import { useEffect } from 'react';
import useTripStore from '../store/trip/tripStore';

/**
 * useTrip hook — provides trip state and actions with auto-fetch on mount
 */
const useTrip = (autoFetch = false) => {
  const trips = useTripStore((s) => s.trips);
  const currentTrip = useTripStore((s) => s.currentTrip);
  const isLoading = useTripStore((s) => s.isLoading);
  const isCreating = useTripStore((s) => s.isCreating);
  const error = useTripStore((s) => s.error);
  const fetchTrips = useTripStore((s) => s.fetchTrips);
  const fetchTripById = useTripStore((s) => s.fetchTripById);
  const createTrip = useTripStore((s) => s.createTrip);
  const updateTrip = useTripStore((s) => s.updateTrip);
  const deleteTrip = useTripStore((s) => s.deleteTrip);
  const shareTrip = useTripStore((s) => s.shareTrip);
  const fetchSharedTrip = useTripStore((s) => s.fetchSharedTrip);
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);
  const clearError = useTripStore((s) => s.clearError);

  useEffect(() => {
    if (autoFetch) {
      fetchTrips();
    }
  }, [autoFetch]);

  return {
    trips,
    currentTrip,
    isLoading,
    isCreating,
    error,
    fetchTrips,
    fetchTripById,
    createTrip,
    updateTrip,
    deleteTrip,
    shareTrip,
    fetchSharedTrip,
    setCurrentTrip,
    clearError,
  };
};

export default useTrip;
