import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import HotelCard from '../../components/hotel/HotelCard';
import EmptyState from '../../components/common/EmptyState';
import Loading from '../../components/common/Loading';
import useTrip from '../../hooks/useTrip';
import { COLORS, SPACING } from '../../utils/constants';

const HotelSuggestionScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;
  const { currentTrip: trip, isLoading, fetchTripById } = useTrip();

  useEffect(() => {
    if (!trip || trip._id !== tripId) {
      fetchTripById(tripId);
    }
  }, [tripId]);

  if (isLoading) return <Loading />;

  const hotel = trip?.hotelRecommendation;

  return (
    <View style={styles.container}>
      <Header title="Gợi ý khách sạn" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {hotel ? (
          <>
            <Text style={styles.intro}>Khách sạn AI gợi ý dành cho chuyến đi của bạn:</Text>
            <HotelCard hotel={hotel} />
          </>
        ) : (
          <EmptyState
            icon="bed-outline"
            title="Chưa có gợi ý khách sạn"
            subtitle="Tạo chuyến đi với AI để nhận gợi ý khách sạn phù hợp"
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md },
  intro: { fontSize: 13, color: COLORS.gray[500], marginBottom: SPACING.md, fontStyle: 'italic' },
});

export default HotelSuggestionScreen;
