import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';
import * as adminApi from '../../services/admin/adminApi';

const AdminSettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { logout, user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminsList, setAdminsList] = useState([]);

  // Form states
  const [indPrice, setIndPrice] = useState('99000');
  const [famPrice, setFamPrice] = useState('249000');
  const [notifyMod, setNotifyMod] = useState(true);
  const [notifyRevenue, setNotifyRevenue] = useState(false);
  const [emailReport, setEmailReport] = useState('admin@travelmate.com');
  const [frequency, setFrequency] = useState('Ngay lập tức');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSettings();
      if (res.success) {
        const { settings, admins } = res.data;
        setIndPrice(settings.premiumIndividualPrice.toString());
        setFamPrice(settings.premiumFamilyPrice.toString());
        setNotifyMod(settings.isNotificationEnabled);
        setNotifyRevenue(settings.isDailyReportEnabled);
        setEmailReport(settings.emailReportRecipient);
        setFrequency(settings.notificationFrequency);
        
        // Exclude current user from re-assigning their own role
        setAdminsList(admins);
      } else {
        Alert.alert('Lỗi', res.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const payload = {
        premiumIndividualPrice: Number(indPrice),
        premiumFamilyPrice: Number(famPrice),
        isNotificationEnabled: notifyMod,
        isDailyReportEnabled: notifyRevenue,
        emailReportRecipient: emailReport,
        notificationFrequency: frequency,
      };

      const res = await adminApi.updateSettings(payload);
      if (res.success) {
        Alert.alert('Thành công', 'Đã cập nhật cài đặt hệ thống!');
        loadSettings();
      } else {
        Alert.alert('Thất bại', res.message);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminRoleChange = async (adminId, name, newRole) => {
    if (adminId === currentUser._id || adminId === 'mock-admin-id') {
      Alert.alert('Lỗi', 'Bạn không thể tự thay đổi quyền hạn của chính mình.');
      return;
    }

    Alert.alert(
      'Thay đổi phân quyền',
      `Bạn chắc chắn muốn đổi quyền của "${name}" sang "${newRole}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const res = await adminApi.updateUserRole(adminId, newRole);
              if (res.success) {
                Alert.alert('Thành công', 'Đã thay đổi vai trò quản trị viên!');
                loadSettings();
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể thay đổi phân quyền.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + SPACING.md }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Cài đặt hệ thống</Text>

      {/* CARD 1: PREMIUM PACKAGE CONFIGURATION */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="card-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cardHeaderTitle}>Quản lý gói Premium</Text>
        </View>

        <Text style={styles.inputLabel}>Gói cá nhân (Premium Individual)</Text>
        <View style={styles.currencyInputWrapper}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={indPrice}
            onChangeText={setIndPrice}
          />
          <Text style={styles.currencyLabel}>VNĐ/Tháng</Text>
        </View>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Gói gia đình (Premium Family)</Text>
        <View style={styles.currencyInputWrapper}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={famPrice}
            onChangeText={setFamPrice}
          />
          <Text style={styles.currencyLabel}>VNĐ/Tháng</Text>
        </View>
      </View>

      {/* CARD 2: NOTIFICATIONS AND SUMMARY REPORTS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cardHeaderTitle}>Cấu hình thông báo</Text>
        </View>

        {/* Notify Toggle 1 */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrapper}>
            <Text style={styles.toggleTitle}>Thông báo phê duyệt mới</Text>
            <Text style={styles.toggleDesc}>Gửi thông báo khi có yêu cầu kiểm duyệt mới.</Text>
          </View>
          <Switch
            value={notifyMod}
            onValueChange={setNotifyMod}
            trackColor={{ false: '#CBD5E1', true: COLORS.primaryLight }}
            thumbColor={notifyMod ? COLORS.primary : '#94A3B8'}
          />
        </View>

        <View style={styles.divider} />

        {/* Notify Toggle 2 */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrapper}>
            <Text style={styles.toggleTitle}>Báo cáo doanh thu hàng ngày</Text>
            <Text style={styles.toggleDesc}>Tự động gửi thống kê doanh thu lúc 08:00 mỗi ngày.</Text>
          </View>
          <Switch
            value={notifyRevenue}
            onValueChange={setNotifyRevenue}
            trackColor={{ false: '#CBD5E1', true: COLORS.primaryLight }}
            thumbColor={notifyRevenue ? COLORS.primary : '#94A3B8'}
          />
        </View>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Email nhận báo cáo hệ thống</Text>
        <TextInput
          style={styles.simpleInput}
          value={emailReport}
          onChangeText={setEmailReport}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Tần suất thông báo</Text>
        <View style={styles.frequencyRow}>
          {['Ngay lập tức', 'Hàng giờ', 'Hàng ngày'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.freqChip, frequency === f && styles.freqChipActive]}
              onPress={() => setFrequency(f)}
            >
              <Text style={[styles.freqChipText, frequency === f && styles.freqChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CARD 3: ADMIN PERMISSIONS PRIVILEGES */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cardHeaderTitle}>Quản lý phân quyền Admin</Text>
        </View>

        <Text style={styles.descText}>
          Danh sách tài khoản được quyền đăng nhập bảng điều khiển và mức phân quyền của họ:
        </Text>

        {adminsList.map((adm) => (
          <View key={adm._id} style={styles.adminRow}>
            <View style={styles.adminInfo}>
              <Text style={styles.adminName}>{adm.name}</Text>
              <Text style={styles.adminEmail}>{adm.email}</Text>
            </View>
            
            {/* Quick role change trigger */}
            <View style={styles.roleSelectionRow}>
              {['admin', 'moderator', 'analyst'].map((r) => {
                const isSelected = adm.role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleSelectChip, isSelected && styles.roleSelectChipActive]}
                    onPress={() => handleAdminRoleChange(adm._id, adm.name, r)}
                  >
                    <Text style={[styles.roleSelectChipText, isSelected && styles.roleSelectChipTextActive]}>
                      {r === 'admin' ? 'Admin' : r === 'moderator' ? 'Mod' : 'Analyst'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* FOOTER ACTIONS BAR */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={loadSettings}>
          <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* DETACHED LOGOUT */}
      <TouchableOpacity style={styles.bigLogoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.error} style={{ marginRight: 6 }} />
        <Text style={styles.bigLogoutBtnText}>Đăng xuất tài khoản Admin</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingTop: 12,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    paddingBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 6,
  },
  currencyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 12,
    height: 46,
  },
  input: {
    flex: 1,
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '700',
  },
  currencyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[400],
  },
  simpleInput: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 12,
    height: 46,
    color: COLORS.black,
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleTextWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
  toggleDesc: {
    fontSize: 11,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginVertical: 10,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  freqChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  freqChipActive: {
    backgroundColor: COLORS.primaryLight,
  },
  freqChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  freqChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  descText: {
    fontSize: 12,
    color: COLORS.gray[400],
    lineHeight: 16,
    marginBottom: 16,
  },
  adminRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    paddingVertical: 12,
    gap: 8,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
  adminEmail: {
    fontSize: 11,
    color: COLORS.gray[400],
  },
  roleSelectionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  roleSelectChip: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  roleSelectChipActive: {
    backgroundColor: COLORS.primaryLight,
  },
  roleSelectChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray[500],
  },
  roleSelectChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray[150] || '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  saveBtn: {
    flex: 2.2,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  bigLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  bigLogoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
  },
});

export default AdminSettingsScreen;
