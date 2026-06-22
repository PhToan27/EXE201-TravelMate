import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import useAuth from '../../hooks/useAuth';
import useTrip from '../../hooks/useTrip';
import { createPremiumPayment, getPremiumPaymentStatus } from '../../services/auth/authApi';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

const premiumExpiryText = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('vi-VN')
    : 'chưa có thông tin';
};

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshProfile } = useAuth();
  const { trips } = useTrip(true);
  const [upgrading, setUpgrading] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const paymentRes = await createPremiumPayment();
      const payment = paymentRes?.data;
      if (!paymentRes?.success || !payment?.checkoutUrl) {
        Alert.alert('Không thể tạo thanh toán', paymentRes?.message || 'PayOS chưa trả về liên kết thanh toán.');
        return;
      }

      await WebBrowser.openBrowserAsync(payment.checkoutUrl);
      const statusRes = await getPremiumPaymentStatus(payment.orderCode);
      if (statusRes?.data?.status === 'PAID') {
        await refreshProfile();
        Alert.alert('Thanh toán thành công', 'Tài khoản của bạn đã được nâng cấp Premium.');
      } else {
        Alert.alert('Chưa thanh toán', 'PayOS chưa ghi nhận đơn này. Bạn có thể kiểm tra lại sau ít phút.');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Không thể kết nối PayOS lúc này.';
      Alert.alert('Không thể mở PayOS', message);
    } finally {
      setUpgrading(false);
    }
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

      {user?.package !== 'premium' && (
        <View style={styles.premiumCard}>
          <View style={styles.premiumCopy}>
            <View style={styles.premiumIcon}>
              <Ionicons name="diamond-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumTitle}>TravelMate Premium</Text>
              <Text style={styles.premiumSubtitle}>Mở nhật ký chuyến đi và trải nghiệm gợi ý nâng cao.</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.premiumButton, upgrading && styles.premiumButtonDisabled]} onPress={() => setPremiumModalVisible(true)} disabled={upgrading} activeOpacity={0.85}>
            {upgrading ? <Text style={styles.premiumButtonText}>Đang mở PayOS...</Text> : <><Ionicons name="card-outline" size={18} color={COLORS.white} /><Text style={styles.premiumButtonText}>Mua Premium - 10.000 đ</Text></>}
          </TouchableOpacity>
        </View>
      )}

      {user?.package === 'premium' && (
        <View style={[styles.premiumCard, styles.activePremiumCard]}>
          <View style={styles.premiumCopy}>
            <View style={styles.premiumIcon}>
              <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumTitle}>Premium đang hoạt động</Text>
              <Text style={styles.premiumSubtitle}>Hiệu lực đến {premiumExpiryText(user.premiumExpiresAt)}.</Text>
            </View>
          </View>
        </View>
      )}

      <Modal visible={premiumModalVisible} transparent animationType="fade" onRequestClose={() => setPremiumModalVisible(false)}>
        <View style={styles.premiumModalOverlay}>
          <View style={styles.premiumModal}>
            <TouchableOpacity style={styles.premiumModalClose} onPress={() => setPremiumModalVisible(false)} accessibilityLabel="Đóng">
              <Ionicons name="close" size={22} color={COLORS.gray[600]} />
            </TouchableOpacity>
            <View style={styles.premiumModalIcon}>
              <Ionicons name="shield-checkmark-outline" size={30} color={COLORS.primary} />
            </View>
            <Text style={styles.premiumModalKicker}>TRAVELMATE PREMIUM</Text>
            <Text style={styles.premiumModalTitle}>Du lịch chủ động hơn</Text>
            <Text style={styles.premiumModalSummary}>Gói Premium có hiệu lực 30 ngày kể từ khi PayOS xác nhận thanh toán.</Text>
            <View style={styles.premiumBenefitList}>
              <PremiumBenefit icon="images-outline" text="Tạo và lưu nhật ký chuyến đi kèm ảnh" />
              <PremiumBenefit icon="sparkles-outline" text="Nhận gợi ý lịch trình được tối ưu hơn" />
              <PremiumBenefit icon="calendar-outline" text="Truy cập quyền lợi Premium trong 30 ngày" />
            </View>
            <View style={styles.premiumPriceRow}>
              <Text style={styles.premiumPrice}>10.000 đ</Text>
              <Text style={styles.premiumDuration}>/ 30 ngày</Text>
            </View>
            <View style={styles.premiumModalActions}>
              <TouchableOpacity style={styles.premiumLaterButton} onPress={() => setPremiumModalVisible(false)}>
                <Text style={styles.premiumLaterText}>Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.premiumButton, styles.premiumConfirmButton, upgrading && styles.premiumButtonDisabled]}
                onPress={() => { setPremiumModalVisible(false); handleUpgrade(); }}
                disabled={upgrading}
              >
                <Ionicons name="card-outline" size={18} color={COLORS.white} />
                <Text style={styles.premiumButtonText}>Thanh toán</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

const PremiumBenefit = ({ icon, text }) => (
  <View style={styles.premiumBenefitItem}>
    <Ionicons name="checkmark-circle" size={19} color={COLORS.success} />
    <Text style={styles.premiumBenefitText}>{text}</Text>
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
  premiumCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    gap: SPACING.md,
  },
  activePremiumCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  premiumCopy: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  premiumIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black, marginBottom: 2 },
  premiumSubtitle: { fontSize: 12, lineHeight: 18, color: COLORS.gray[500] },
  premiumButton: {
    minHeight: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  premiumButtonDisabled: { opacity: 0.65 },
  premiumButtonText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
  premiumModalOverlay: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  premiumModal: {
    position: 'relative',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
  },
  premiumModalClose: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumModalIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    marginBottom: SPACING.md,
  },
  premiumModalKicker: { fontSize: 12, fontWeight: '800', color: COLORS.primary, marginBottom: 6 },
  premiumModalTitle: { fontSize: 24, fontWeight: '800', color: COLORS.black, marginBottom: SPACING.sm },
  premiumModalSummary: { fontSize: 14, lineHeight: 21, color: COLORS.gray[500], marginBottom: SPACING.md },
  premiumBenefitList: { gap: 12, padding: SPACING.md, backgroundColor: COLORS.gray[50], borderWidth: 1, borderColor: COLORS.gray[200] },
  premiumBenefitItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  premiumBenefitText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.gray[700] },
  premiumPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, marginVertical: SPACING.md },
  premiumPrice: { fontSize: 27, fontWeight: '800', color: COLORS.primary },
  premiumDuration: { fontSize: 14, color: COLORS.gray[500] },
  premiumModalActions: { flexDirection: 'row', gap: SPACING.sm },
  premiumLaterButton: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: COLORS.gray[300], borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  premiumLaterText: { fontSize: 14, fontWeight: '700', color: COLORS.gray[600] },
  premiumConfirmButton: { flex: 1.4 },
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
