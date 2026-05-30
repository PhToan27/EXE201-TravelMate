import useAuthStore from '../store/auth/authStore';

/**
 * useAuth hook — provides auth state and actions
 */
const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const clearError = useAuthStore((s) => s.clearError);

  const isAuthenticated = !!token;

  return {
    user,
    token,
    isLoading,
    isInitialized,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    refreshProfile,
    clearError,
  };
};

export default useAuth;
