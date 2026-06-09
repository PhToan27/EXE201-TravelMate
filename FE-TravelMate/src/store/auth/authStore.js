import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';
import * as authApi from '../../services/auth/authApi';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Initialize: load token from storage
  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const user = userJson ? JSON.parse(userJson) : null;
      set({ token, user, isInitialized: true });
    } catch {
      set({ isInitialized: true });
    }
  },

  // Login action
  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.login({ email, password });
      if (result.success) {
        const { token, ...user } = result.data;
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        set({ user, token, isLoading: false });
        return { success: true };
      }
      set({ isLoading: false, error: result.message });
      return { success: false, message: result.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Register action
  register: async ({ name, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.register({ name, email, password });
      if (result.success) {
        const { token, ...user } = result.data;
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        set({ user, token, isLoading: false });
        return { success: true };
      }
      set({ isLoading: false, error: result.message });
      return { success: false, message: result.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Google OAuth login action
  loginWithGoogle: async ({ googleId, email, name, avatar }) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.googleLogin({ googleId, email, name, avatar });
      if (result.success) {
        const { token, ...user } = result.data;
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        set({ user, token, isLoading: false });
        return { success: true };
      }
      set({ isLoading: false, error: result.message });
      return { success: false, message: result.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập Google thất bại';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Logout action
  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    set({ user: null, token: null, error: null });
  },

  // Refresh profile
  refreshProfile: async () => {
    try {
      const result = await authApi.getProfile();
      if (result.success) {
        const user = result.data;
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        set({ user });
      }
    } catch {
      // Silently fail
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
