import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';

import HomeScreen from '../screens/home/HomeScreen';
import SavedTripsScreen from '../screens/trip/SavedTripsScreen';
import CreateTripScreen from '../screens/trip/CreateTripScreen';
import TripDetailScreen from '../screens/trip/TripDetailScreen';
import EditTripScreen from '../screens/trip/EditTripScreen';
import PackingListScreen from '../screens/trip/PackingListScreen';
import SharedTripScreen from '../screens/trip/SharedTripScreen';
import HotelSuggestionScreen from '../screens/hotel/HotelSuggestionScreen';
import RestaurantSuggestionScreen from '../screens/restaurant/RestaurantSuggestionScreen';
import BudgetBreakdownScreen from '../screens/budget/BudgetBreakdownScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PlaceDetailScreen from '../screens/trip/PlaceDetailScreen';
import RouteMapScreen from '../screens/trip/RouteMapScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import PostDetailScreen from '../screens/community/PostDetailScreen';
import MyPostsScreen from '../screens/community/MyPostsScreen';
import NotificationsScreen from '../screens/community/NotificationsScreen';
import UserProfileScreen from '../screens/community/UserProfileScreen';
import AdminModerationScreen from '../screens/community/AdminModerationScreen';
import SearchPlacesScreen from '../screens/place/SearchPlacesScreen';

import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const RootStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={TabNavigator} />
    <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    <Stack.Screen name="EditTrip" component={EditTripScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="PackingList" component={PackingListScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="SharedTrip" component={SharedTripScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="HotelSuggestion" component={HotelSuggestionScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="RestaurantSuggestion" component={RestaurantSuggestionScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="BudgetBreakdown" component={BudgetBreakdownScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="RouteMap" component={RouteMapScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="MyPosts" component={MyPostsScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="AdminModeration" component={AdminModerationScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="SearchPlaces" component={SearchPlacesScreen} options={{ animation: 'slide_from_right' }} />
  </Stack.Navigator>
);

const ExpensesPlaceholder = () => (
  <View style={placeholderStyles.container}>
    <Ionicons name="cash-outline" size={64} color={COLORS.primary} />
    <Text style={placeholderStyles.title}>Quản lý chi phí</Text>
    <Text style={placeholderStyles.subtitle}>Tính năng quản lý chi phí tổng hợp đang được phát triển!</Text>
  </View>
);

const TabNavigator = () => (
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
          SavedTrips: focused ? 'briefcase' : 'briefcase-outline',
          Community: focused ? 'globe' : 'globe-outline',
          Expenses: focused ? 'cash' : 'cash-outline',
          Profile: focused ? 'person-circle' : 'person-circle-outline',
        };
        const iconName = icons[route.name] || 'ellipse-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
    <Tab.Screen name="SavedTrips" component={SavedTripsScreen} options={{ tabBarLabel: 'Chuyến đi' }} />
    <Tab.Screen name="Community" component={CommunityScreen} options={{ tabBarLabel: 'Cộng đồng' }} />
    <Tab.Screen name="Expenses" component={ExpensesPlaceholder} options={{ tabBarLabel: 'Chi phí' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Hồ sơ' }} />
  </Tab.Navigator>
);

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
});

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

export default RootStack;
