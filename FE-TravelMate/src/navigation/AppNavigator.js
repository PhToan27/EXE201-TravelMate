import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import useAuth from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import AdminNavigator from './AdminNavigator';
import { COLORS } from '../utils/constants';

const AppNavigator = () => {
  const { isAuthenticated, isInitialized, user } = useAuth();

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Check if authenticated user is admin, moderator, or analyst
  const isAdminUser = user && ['admin', 'moderator', 'analyst'].includes(user.role);

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        isAdminUser ? <AdminNavigator /> : <MainNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
