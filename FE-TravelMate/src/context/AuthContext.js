import React, { createContext, useContext, useEffect } from 'react';
import useAuthStore from '../store/auth/authStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <AuthContext.Provider value={useAuthStore}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
