import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Platform } from 'react-native';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminModerationScreen from '../screens/admin/AdminModerationScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();

const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'stats-chart' : 'stats-chart-outline',
            Users: focused ? 'people' : 'people-outline',
            Moderation: focused ? 'document-text' : 'document-text-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          const iconName = icons[route.name] || 'ellipse-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ tabBarLabel: 'Tổng quan' }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{ tabBarLabel: 'Thành viên' }}
      />
      <Tab.Screen
        name="Moderation"
        component={AdminModerationScreen}
        options={{ tabBarLabel: 'Kiểm duyệt' }}
      />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsScreen}
        options={{ tabBarLabel: 'Cài đặt' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default AdminNavigator;
