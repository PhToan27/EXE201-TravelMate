import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Loading from '../../components/common/Loading';
import TripTimeline from '../../components/trip/TripTimeline';
import HotelCard from '../../components/hotel/HotelCard';
import CustomButton from '../../components/common/CustomButton';
import useTrip from '../../hooks/useTrip';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { formatDateRange, getDayCount } from '../../utils/dateUtils';
import { formatVND } from '../../utils/currencyUtils';

const SharedTripScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { shareCode: paramCode } = route.params || {};
  const { currentTrip: trip, isLoading, fetchSharedTrip } = useTrip();
  const [shareCode, setShareCode] = useState(paramCode || '');
  const [searched, setSearched] = useState(!!paramCode);

  useEffect(() => {
    if (paramCode) {
      fetchSharedTrip(paramCode);
    }
  }, [paramCode]);

  const handleSearch = () => {
    if (!shareCode.trim()) return;
    setSearched(true);
    fetchSharedTrip(shareCode.trim().toUpperCase());
  };

  return (
    <View style={styles.container}>
      <Header
        title="Chuyến đi được chia sẻ"
        onBack={() => navigation.goBack()}
      />

      {/* Share code input */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="link-outline" size={18} color={COLORS.gray[400]} />
          <TextInput
            value={shareCode}
            onChangeText={setShareCode}
            placeholder="Nhập mã chia sẻ (VD: AB12CD7)"
            placeholderTextColor={COLORS.gray[400]}
            autoCapitalize="characters"
            style={styles.inputField}
          />
        </View>
        <CustomButton title="Tìm" onPress={handleSearch} size="sm" style={styles.searchBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && <Loading message="Đang tải..." />}

        {!isLoading && searched && !trip && (
          <Text style={styles.notFound}>Không tìm thấy chuyến đi. Hãy kiểm tra lại mã.</Text>
        )}

        {!isLoading && trip && (
          <>
            <View style={styles.tripHeader}>
              <Text style={styles.destination}>{trip.destination}</Text>
              <Text style={styles.dates}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{getDayCount(trip.startDate, trip.endDate)} ngày</Text>
                <Text style={styles.meta}>•</Text>
                <Text style={styles.meta}>{trip.totalPeople || 1} người</Text>
                <Text style={styles.meta}>•</Text>
                <Text style={styles.meta}>{formatVND(trip.budget)}</Text>
              </View>
            </View>
            <TripTimeline trip={trip} />
            {trip.hotelRecommendation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nơi ở gợi ý</Text>
                <HotelCard hotel={trip.hotelRecommendation} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
    backgroundColor: COLORS.background,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '600',
    letterSpacing: 1,
  },
  searchBtn: { minWidth: 70 },
  scroll: { padding: SPACING.md },
  notFound: {
    fontSize: 14,
    color: COLORS.gray[400],
    textAlign: 'center',
    paddingVertical: SPACING.xl,
    fontStyle: 'italic',
  },
  tripHeader: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  destination: { fontSize: 24, fontWeight: '800', color: COLORS.black, marginBottom: 4 },
  dates: { fontSize: 14, color: COLORS.gray[500], marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: COLORS.gray[500] },
  section: { marginTop: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: SPACING.sm },
});

export default SharedTripScreen;
