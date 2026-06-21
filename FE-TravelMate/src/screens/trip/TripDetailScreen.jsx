import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/common/Header';
import Loading from '../../components/common/Loading';
import TripTimeline from '../../components/trip/TripTimeline';
import HotelCard from '../../components/hotel/HotelCard';
import RestaurantCard from '../../components/restaurant/RestaurantCard';
import useTrip from '../../hooks/useTrip';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { formatDateRange, getDayCount } from '../../utils/dateUtils';
import { formatVND } from '../../utils/currencyUtils';
import { getNearbyPlaces } from '../../services/place/placeApi';

const TABS = ['Lịch trình', 'Nơi ở', 'Ăn uống', 'Ngân sách'];

const TripDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;
  const { currentTrip: trip, isLoading, fetchTripById, shareTrip, deleteTrip } = useTrip();
  const [activeTab, setActiveTab] = useState(0);

  const [altHotels, setAltHotels] = useState([]);
  const [altRestaurants, setAltRestaurants] = useState([]);
  const [loadingAlt, setLoadingAlt] = useState(false);

  useEffect(() => {
    fetchTripById(tripId);
  }, [tripId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTripById(tripId);
    });
    return unsubscribe;
  }, [navigation, tripId]);

  useEffect(() => {
    const fetchAlternatives = async () => {
      if (!trip) return;
      try {
        setLoadingAlt(true);
        // Find coordinates of first activity that has coords
        const firstAct = (trip.activities || []).find(a => a.coordinates && a.coordinates.lat);
        const searchLat = firstAct?.coordinates?.lat || 16.0544;
        const searchLng = firstAct?.coordinates?.lng || 108.2022;

        // Fetch alternative hotels in destination (limit increased to 30)
        const resHotels = await getNearbyPlaces(searchLat, searchLng, trip.hotelRecommendation?.name || '', 30, 'HOTEL', trip.destination);
        if (resHotels.success) {
          setAltHotels(resHotels.data);
        }

        // Fetch alternative restaurants in destination (limit 30, with destination filtering)
        const resRests = await getNearbyPlaces(searchLat, searchLng, '', 30, 'RESTAURANT', trip.destination);
        if (resRests.success) {
          const recommendedNames = (trip.restaurantRecommendations || []).map(r => r.name);
          const filteredRests = resRests.data.filter(r => !recommendedNames.includes(r.name));
          setAltRestaurants(filteredRests);
        }
      } catch (err) {
        console.error('Error fetching alternatives:', err);
      } finally {
        setLoadingAlt(false);
      }
    };

    fetchAlternatives();
  }, [trip?._id, trip?.activities?.length, trip?.hotelRecommendation?.name, trip?.restaurantRecommendations?.length, trip?.destination]);

  const handleShare = async () => {
    const result = await shareTrip(tripId);
    if (result.success) {
      await Share.share({
        message: `Xem lịch trình chuyến đi của tôi trên TravelMate! Mã chia sẻ: ${result.data.shareCode}`,
        title: 'Chia sẻ chuyến đi',
      });
    }
  };

  const handleDelete = () => {
    Alert.alert('Xóa chuyến đi', 'Bạn có chắc muốn xóa chuyến đi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteTrip(tripId);
          if (result.success) navigation.goBack();
        },
      },
    ]);
  };

  if (isLoading || !trip) return <Loading message="Đang tải chuyến đi..." />;

  const dayCount = getDayCount(trip.startDate, trip.endDate);

  return (
    <View style={styles.container}>
      {/* Gradient hero header */}
      <LinearGradient
        colors={['#F97316', '#EA6C0A']}
        style={[styles.heroHeader, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.heroActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Weather', { destination: trip.destination, days: dayCount, tripId: trip._id })} style={styles.heroAction}>
              <Ionicons name="cloudy" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Export', { tripId })} style={styles.heroAction}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('PackingList', { tripId })} style={styles.heroAction}>
              <Ionicons name="bag-handle-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('TripJournal', { tripId })} style={styles.heroAction}>
              <Ionicons name="book-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('EditTrip', { tripId })} style={styles.heroAction}>
              <Ionicons name="pencil-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.heroAction}>
              <Ionicons name="share-social-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.heroAction}>
              <Ionicons name="trash-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.destRow}>
            <Ionicons name="location" size={22} color="rgba(255,255,255,0.9)" />
            <Text style={styles.destination}>{trip.destination}</Text>
          </View>
          <View style={styles.metaRow}>
            <MetaChip icon="calendar-outline" label={formatDateRange(trip.startDate, trip.endDate)} />
            <MetaChip icon="sunny-outline" label={`${dayCount} ngày`} />
            <MetaChip icon="people-outline" label={`${trip.totalPeople || 1} người`} />
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Ngân sách</Text>
            <Text style={styles.budgetValue}>{formatVND(trip.budget)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab, idx) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === idx && styles.tabActive]}
            onPress={() => setActiveTab(idx)}
          >
            <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 0 && (
          <View style={styles.tabContent}>
            <Text style={styles.introText}>📍 Lịch trình tham quan và vui chơi AI thiết kế riêng cho chuyến đi:</Text>
            <TripTimeline trip={trip} tripId={trip._id} />
          </View>
        )}

        {activeTab === 1 && (
          <View style={styles.tabContent}>
            {trip.hotelRecommendation ? (
              <>
                <Text style={styles.introText}>🏨 Gợi ý nơi ở phù hợp với ngân sách của bạn:</Text>
                <HotelCard hotel={trip.hotelRecommendation} tripId={trip._id} />
              </>
            ) : (
              <Text style={styles.noData}>Chưa có gợi ý nơi ở</Text>
            )}

            {altHotels.length > 0 && (
              <View style={styles.altSection}>
                <Text style={styles.altSectionTitle}>🏨 Các lựa chọn nơi lưu trú khác tại {trip.destination}:</Text>
                {altHotels.map((hotel, idx) => (
                  <View key={idx} style={{ marginBottom: SPACING.md }}>
                    <HotelCard hotel={hotel} tripId={trip._id} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 2 && (
          <View style={styles.tabContent}>
            {trip.restaurantRecommendations?.length > 0 ? (
              <>
                <Text style={styles.introText}>🍽️ Danh sách ăn uống địa phương gợi ý cho chuyến đi:</Text>
                {trip.restaurantRecommendations.map((r, i) => (
                  <RestaurantCard key={i} restaurant={r} tripId={trip._id} />
                ))}
              </>
            ) : (
              <Text style={styles.noData}>Chưa có gợi ý ăn uống</Text>
            )}

            {altRestaurants.length > 0 && (
              <View style={styles.altSection}>
                <Text style={styles.altSectionTitle}>🍽️ Địa điểm ăn uống nổi bật khác tại {trip.destination}:</Text>
                {altRestaurants.map((rest, idx) => (
                  <RestaurantCard key={idx} restaurant={rest} tripId={trip._id} />
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 3 && (
          <View style={styles.tabContent}>
            <BudgetSummary trip={trip} onManageExpenses={() => navigation.navigate('ExpenseManager', { tripId: trip._id })} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const MetaChip = ({ icon, label }) => (
  <View style={metaStyles.chip}>
    <Ionicons name={icon} size={13} color="rgba(255,255,255,0.85)" />
    <Text style={metaStyles.label}>{label}</Text>
  </View>
);

const metaStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
});

const BudgetSummary = ({ trip, onManageExpenses }) => {
  const stats = trip.budgetStats;
  const breakdown = trip.budgetBreakdown;

  return (
    <View>
      <TouchableOpacity style={bStyles.manageButton} onPress={onManageExpenses} activeOpacity={0.85}>
        <Ionicons name="receipt-outline" size={18} color={COLORS.white} />
        <Text style={bStyles.manageButtonText}>Quản lý chi phí và bill</Text>
      </TouchableOpacity>
      {stats && (
        <View style={bStyles.card}>
          <Text style={bStyles.title}>Tổng quan</Text>
          <BudgetRow label="Ngân sách" value={formatVND(trip.budget)} />
          <BudgetRow label="Đã chi" value={formatVND(stats.totalExpenses)} highlight />
          <BudgetRow
            label="Còn lại"
            value={formatVND(stats.remainingBudget)}
            color={stats.remainingBudget < 0 ? COLORS.error : COLORS.success}
          />
        </View>
      )}
      {breakdown && (
        <View style={bStyles.card}>
          <Text style={bStyles.title}>Phân bổ AI</Text>
          <BudgetRow label="Lưu trú" value={formatVND(breakdown.accommodation)} />
          <BudgetRow label="Ăn uống" value={formatVND(breakdown.foodAndBeverage)} />
          <BudgetRow label="Tham quan" value={formatVND(breakdown.activitiesAndEntranceFees)} />
          <BudgetRow label="Di chuyển" value={formatVND(breakdown.transportation)} />
          <BudgetRow label="Dự phòng" value={formatVND(breakdown.unforeseenExpenses)} />
        </View>
      )}
    </View>
  );
};

const BudgetRow = ({ label, value, highlight, color }) => (
  <View style={bStyles.row}>
    <Text style={bStyles.label}>{label}</Text>
    <Text style={[bStyles.value, highlight && { color: COLORS.primary }, color && { color }]}>
      {value}
    </Text>
  </View>
);

const bStyles = StyleSheet.create({
  manageButton: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  manageButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: SPACING.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  label: { fontSize: 14, color: COLORS.gray[600] },
  value: { fontSize: 14, fontWeight: '700', color: COLORS.black },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heroHeader: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  heroAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    gap: SPACING.sm,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  destination: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  budgetLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  content: {
    padding: SPACING.md,
  },
  tabContent: {
    gap: SPACING.sm,
  },
  introText: {
    fontSize: 13,
    color: COLORS.gray[500],
    fontStyle: 'italic',
    marginBottom: 4,
    lineHeight: 18,
  },
  noData: {
    fontSize: 14,
    color: COLORS.gray[400],
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  altSection: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  altSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  altScroll: {
    gap: SPACING.md,
    paddingBottom: 8,
  },
  altCardContainer: {
    width: 300,
  },
});

export default TripDetailScreen;
