import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuth from '../../hooks/useAuth';
import useTrip from '../../hooks/useTrip';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { trips } = useTrip(true);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const tripCount = trips.length;
  const totalBudget = trips.reduce((sum, t) => sum + (t.budget || 0), 0);

  const menuItems = [
    { icon: 'person-outline', label: 'Chỉnh sửa hồ sơ', onPress: () => navigation.navigate('EditProfile') },
    { icon: 'bookmark-outline', label: 'Chuyến đi đã lưu', onPress: () => navigation.navigate('SavedTrips') },
    { icon: 'share-social-outline', label: 'Chia sẻ chuyến đi', onPress: () => navigation.navigate('SharedTrip', {}) },
    { icon: 'notifications-outline', label: 'Thông báo', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Trợ giúp & Hỗ trợ', onPress: () => {} },
    { icon: 'information-circle-outline', label: 'Về TravelMate', onPress: () => {} },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.lg }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <LinearGradient
        colors={['#F97316', '#EA6C0A']}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Chuyến đi" value={String(tripCount)} icon="airplane-outline" />
        <StatCard label="Điểm đến" value={String(new Set(trips.map((t) => t.destination)).size)} icon="location-outline" />
        <StatCard label="Ngày đi" value={String(trips.reduce((s, t) => s + (t.totalDays || 0), 0))} icon="calendar-outline" />
      </View>

      {/* Menu */}
      <View style={styles.menuCard}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuBorder]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const StatCard = ({ label, value, icon }) => (
  <View style={statStyles.card}>
    <Ionicons name={icon} size={22} color={COLORS.primary} />
    <Text style={statStyles.value}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  },
  value: { fontSize: 22, fontWeight: '800', color: COLORS.black },
  label: { fontSize: 11, color: COLORS.gray[500] },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    marginTop: -SPACING.lg,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.black,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.error,
  },
});

export default ProfileScreen;
