import { create } from 'zustand';
import * as tripApi from '../../services/trip/tripApi';

const getApiErrorMessage = (error, fallback) => {
  const status = error.response?.status;
  const serverMessage =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.response?.data?.details;
  const timeoutMessage =
    error.code === 'ECONNABORTED'
      ? 'API phản hồi quá lâu, có thể Render đang khởi động hoặc tạo lịch trình quá lâu.'
      : '';
  const message = serverMessage || timeoutMessage || error.message || fallback;

  return status ? `${message} (HTTP ${status})` : message;
};

const useTripStore = create((set, get) => ({
  // State
  trips: [],
  currentTrip: null,
  isLoading: false,
  isCreating: false,
  error: null,

  // Fetch all trips
  fetchTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await tripApi.getTrips();
      if (result.success) {
        set({ trips: result.data, isLoading: false });
      } else {
        set({ isLoading: false, error: result.message });
      }
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.message || 'Lỗi tải danh sách chuyến đi' });
    }
  },

  // Fetch single trip
  fetchTripById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await tripApi.getTripById(id);
      if (result.success) {
        set({ currentTrip: result.data, isLoading: false });
        return result.data;
      }
      set({ isLoading: false, error: result.message });
      return null;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.message || 'Lỗi tải chuyến đi' });
      return null;
    }
  },

  // Create trip
  createTrip: async (tripData) => {
    if (get().isCreating) {
      return { success: false, message: 'Đang tạo chuyến đi, vui lòng chờ.' };
    }

    set({ isCreating: true, error: null });
    try {
      const result = await tripApi.createTrip(tripData);
      if (result.success) {
        set((state) => ({
          trips: [result.data, ...state.trips],
          currentTrip: result.data,
          isCreating: false,
        }));
        return { success: true, data: result.data };
      }
      set({ isCreating: false, error: result.message });
      return { success: false, message: result.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Lỗi tạo chuyến đi';
      console.error('Create trip error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
      const detailedMessage = getApiErrorMessage(error, message);
      set({ isCreating: false, error: detailedMessage });
      return { success: false, message: detailedMessage };
    }
  },

  // Update trip
  updateTrip: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const result = await tripApi.updateTrip(id, updates);
      if (result.success) {
        set((state) => ({
          trips: state.trips.map((t) => (t._id === id ? result.data : t)),
          currentTrip: state.currentTrip?._id === id ? result.data : state.currentTrip,
          isLoading: false,
        }));
        return { success: true, data: result.data };
      }
      set({ isLoading: false, error: result.message });
      return { success: false, message: result.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Lỗi cập nhật chuyến đi';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Delete trip
  deleteTrip: async (id) => {
    set({ isLoading: true });
    try {
      const result = await tripApi.deleteTrip(id);
      if (result.success) {
        set((state) => ({
          trips: state.trips.filter((t) => t._id !== id),
          currentTrip: state.currentTrip?._id === id ? null : state.currentTrip,
          isLoading: false,
        }));
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false };
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.message || 'Lỗi xóa chuyến đi' });
      return { success: false };
    }
  },

  // Share trip
  shareTrip: async (id) => {
    try {
      const result = await tripApi.shareTrip(id);
      return result;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Lỗi chia sẻ chuyến đi' };
    }
  },

  // Get shared trip (public)
  fetchSharedTrip: async (shareCode) => {
    set({ isLoading: true, error: null });
    try {
      const result = await tripApi.getSharedTrip(shareCode);
      if (result.success) {
        set({ currentTrip: result.data, isLoading: false });
        return result.data;
      }
      set({ isLoading: false, error: result.message });
      return null;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.message || 'Không tìm thấy chuyến đi' });
      return null;
    }
  },

  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  clearError: () => set({ error: null }),
}));

export default useTripStore;
