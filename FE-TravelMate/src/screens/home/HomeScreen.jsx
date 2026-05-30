import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuth from '../../hooks/useAuth';
import useTrip from '../../hooks/useTrip';
import TripCard from '../../components/trip/TripCard';
import EmptyState from '../../components/common/EmptyState';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { trips, isLoading, fetchTrips } = useTrip(true);

  const recentTrips = trips.slice(0, 3);
  const firstName = user?.name?.split(' ').pop() || 'bạn';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.lg }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={fetchTrips} colors={[COLORS.primary]} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#F97316', '#FB923C']}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào, {firstName} 👋</Text>
            <Text style={styles.headerSub}>Bạn muốn đi đâu hôm nay?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={40} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Search bar style CTA */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('CreateTrip')}
          activeOpacity={0.9}
        >
          <Ionicons name="search-outline" size={18} color={COLORS.gray[400]} />
          <Text style={styles.searchPlaceholder}>Tìm kiếm điểm đến...</Text>
          <View style={styles.searchBtn}>
            <Ionicons name="options-outline" size={18} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <QuickAction
          icon="add-circle"
          label="Tạo chuyến đi"
          color={COLORS.primary}
          onPress={() => navigation.navigate('CreateTrip')}
        />
        <QuickAction
          icon="bookmark"
          label="Đã lưu"
          color="#3B82F6"
          onPress={() => navigation.navigate('SavedTrips')}
        />
        <QuickAction
          icon="wallet"
          label="Ngân sách"
          color="#10B981"
          onPress={() => navigation.navigate('SavedTrips')}
        />
        <QuickAction
          icon="person"
          label="Hồ sơ"
          color="#8B5CF6"
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      {/* Recent trips */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chuyến đi gần đây</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SavedTrips')}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {trips.length === 0 ? (
          <EmptyState
            icon="airplane-outline"
            title="Chưa có chuyến đi nào"
            subtitle="Tạo chuyến đi đầu tiên của bạn và trải nghiệm lập kế hoạch thông minh với AI"
            action={
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateTrip')}
              >
                <LinearGradient
                  colors={['#F97316', '#EA6C0A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createGradient}
                >
                  <Ionicons name="add" size={20} color={COLORS.white} />
                  <Text style={styles.createText}>Tạo chuyến đi</Text>
                </LinearGradient>
              </TouchableOpacity>
            }
          />
        ) : (
          recentTrips.map((trip) => (
            <TripCard
              key={trip._id}
              trip={trip}
              onPress={() => navigation.navigate('TripDetail', { tripId: trip._id })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const QuickAction = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={qaStyles.item} onPress={onPress} activeOpacity={0.8}>
    <View style={[qaStyles.iconWrap, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={qaStyles.label}>{label}</Text>
  </TouchableOpacity>
);

const qaStyles = StyleSheet.create({
  item: { alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 12, color: COLORS.gray[600], fontWeight: '500', textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  profileBtn: {
    opacity: 0.9,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: SPACING.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[400],
  },
  searchBtn: {
    padding: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
  section: {
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  createBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
  },
  createText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default HomeScreen;
