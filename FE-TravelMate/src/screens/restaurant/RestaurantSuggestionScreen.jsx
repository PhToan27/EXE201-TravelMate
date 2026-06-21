import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import RestaurantCard from '../../components/restaurant/RestaurantCard';
import EmptyState from '../../components/common/EmptyState';
import Loading from '../../components/common/Loading';
import useTrip from '../../hooks/useTrip';
import { COLORS, SPACING } from '../../utils/constants';

const RestaurantSuggestionScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;
  const { currentTrip: trip, isLoading, fetchTripById } = useTrip();

  useEffect(() => {
    if (!trip || trip._id !== tripId) {
      fetchTripById(tripId);
    }
  }, [tripId]);

  if (isLoading) return <Loading />;

  const restaurants = trip?.restaurantRecommendations || [];

  return (
    <View style={styles.container}>
      <Header
        title="Gợi ý ăn uống"
        subtitle={`${restaurants.length} địa điểm`}
        onBack={() => navigation.goBack()}
      />
      {restaurants.length === 0 ? (
        <EmptyState
          icon="restaurant-outline"
          title="Chưa có gợi ý ăn uống"
          subtitle="Tạo chuyến đi để nhận gợi ý ăn uống"
        />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.lg }]}
          ListHeaderComponent={
            <Text style={styles.intro}>Địa điểm ăn uống gợi ý dành cho chuyến đi của bạn:</Text>
          }
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md },
  intro: { fontSize: 13, color: COLORS.gray[500], marginBottom: SPACING.md, fontStyle: 'italic' },
});

export default RestaurantSuggestionScreen;
