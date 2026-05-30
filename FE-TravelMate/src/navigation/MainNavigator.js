import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen from '../screens/home/HomeScreen';
import SavedTripsScreen from '../screens/trip/SavedTripsScreen';
import CreateTripScreen from '../screens/trip/CreateTripScreen';
import TripDetailScreen from '../screens/trip/TripDetailScreen';
import EditTripScreen from '../screens/trip/EditTripScreen';
import SharedTripScreen from '../screens/trip/SharedTripScreen';
import HotelSuggestionScreen from '../screens/hotel/HotelSuggestionScreen';
import RestaurantSuggestionScreen from '../screens/restaurant/RestaurantSuggestionScreen';
import BudgetBreakdownScreen from '../screens/budget/BudgetBreakdownScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

import { COLORS, RADIUS } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Root stack to allow modal-style screens over the tab bar
const RootStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="EditTrip" component={EditTripScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SharedTrip" component={SharedTripScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="HotelSuggestion" component={HotelSuggestionScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="RestaurantSuggestion" component={RestaurantSuggestionScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="BudgetBreakdown" component={BudgetBreakdownScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
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
            Home: focused ? 'home' : 'home-outline',
            SavedTrips: focused ? 'bookmark' : 'bookmark-outline',
            CreateTripTab: 'add-circle',
            Profile: focused ? 'person' : 'person-outline',
          };
          const iconName = icons[route.name] || 'ellipse-outline';

          if (route.name === 'CreateTripTab') {
            return (
              <View style={styles.createTabIcon}>
                <Ionicons name="add" size={28} color={COLORS.white} />
              </View>
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="SavedTrips" component={SavedTripsScreen} options={{ tabBarLabel: 'Chuyến đi' }} />
      <Tab.Screen
        name="CreateTripTab"
        component={CreateTripScreen}
        options={{ tabBarLabel: '', tabBarStyle: { display: 'none' } }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CreateTrip');
          },
        })}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Hồ sơ' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  createTabIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default RootStack;
