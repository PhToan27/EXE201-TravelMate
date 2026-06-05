import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import * as adminApi from '../../services/admin/adminApi';

const AdminUsersScreen = () => {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'suspended'
  const [pkgFilter, setPkgFilter] = useState('all'); // 'all', 'free', 'premium'

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Selection state for Bottom Actions Sheet
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchUsers = async (pageNum = 1, isLoadMore = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = {
        q: search,
        status: statusFilter,
        packageType: pkgFilter,
        page: pageNum,
        limit: 10,
      };

      const res = await adminApi.getUsers(params);
      if (res.success) {
        const { users: fetchedUsers, total, pages } = res.data;
        if (isLoadMore) {
          setUsers((prev) => [...prev, ...fetchedUsers]);
        } else {
          setUsers(fetchedUsers);
        }
        setTotalUsers(total);
        setTotalPages(pages);
        setPage(pageNum);
      } else {
        Alert.alert('Lỗi', res.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, false);
  }, [search, statusFilter, pkgFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(1, false);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchUsers(page + 1, true);
    }
  };

  const handleOpenActions = (userItem) => {
    setSelectedUser(userItem);
    setModalVisible(true);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await adminApi.updateUserStatus(selectedUser._id, newStatus);
      if (res.success) {
        Alert.alert('Thành công', 'Đã cập nhật trạng thái tài khoản!');
        setModalVisible(false);
        fetchUsers(1, false); // Reload
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
    }
  };

  const handlePackageChange = async (newPkg) => {
    try {
      const res = await adminApi.updateUserPackage(selectedUser._id, newPkg);
      if (res.success) {
        Alert.alert('Thành công', 'Đã cập nhật gói dịch vụ!');
        setModalVisible(false);
        fetchUsers(1, false);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật gói.');
    }
  };

  const handleRoleChange = async (newRole) => {
    try {
      const res = await adminApi.updateUserRole(selectedUser._id, newRole);
      if (res.success) {
        Alert.alert('Thành công', 'Đã thay đổi phân quyền thành công!');
        setModalVisible(false);
        fetchUsers(1, false);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đổi quyền.');
    }
  };

  const renderUserItem = ({ item }) => {
    const isPremium = item.package === 'premium';
    const isActive = item.status === 'active';

    return (
      <TouchableOpacity style={styles.userCard} onPress={() => handleOpenActions(item)}>
        <View style={styles.userCardLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{item.name?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userId}>ID: #{item._id.substring(0, 8)}</Text>
          </View>
        </View>

        <View style={styles.userCardRight}>
          <View style={[styles.badgeStyle, isPremium ? styles.badgePremium : styles.badgeFree]}>
            <Text style={isPremium ? styles.badgeTextPremium : styles.badgeTextFree}>
              {isPremium ? 'Premium' : 'Free'}
            </Text>
          </View>
          <View style={[styles.badgeStyle, isActive ? styles.badgeActive : styles.badgeSuspended, { marginTop: 6 }]}>
            <Text style={isActive ? styles.badgeTextActive : styles.badgeTextSuspended}>
              {isActive ? 'Hoạt động' : 'Bị khóa'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* SEARCH AND FILTERS */}
      <View style={[styles.filterSection, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color={COLORS.gray[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm tên, email..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>

        {/* CHIP FILTERS Row 1 (Package) */}
        <View style={styles.chipsRow}>
          <Text style={styles.chipLabel}>Gói:</Text>
          {['all', 'premium', 'free'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, pkgFilter === type && styles.chipActive]}
              onPress={() => setPkgFilter(type)}
            >
              <Text style={[styles.chipText, pkgFilter === type && styles.chipTextActive]}>
                {type === 'all' ? 'Tất cả' : type === 'premium' ? 'Premium' : 'Free'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CHIP FILTERS Row 2 (Status) */}
        <View style={[styles.chipsRow, { marginTop: 6 }]}>
          <Text style={styles.chipLabel}>Trạng thái:</Text>
          {['all', 'active', 'suspended'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.chip, statusFilter === status && styles.chipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.chipText, statusFilter === status && styles.chipTextActive]}>
                {status === 'all' ? 'Tất cả' : status === 'active' ? 'Hoạt động' : 'Bị khóa'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* USERS FLATLIST */}
      {loading ? (
        <View style={styles.centerSpinner}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không tìm thấy thành viên nào phù hợp.</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.footerSpinner} />
            ) : null
          }
        />
      )}

      {/* BOTTOM SHEET ACTIONS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedUser?.name}</Text>
              <Text style={styles.modalSubtitle}>{selectedUser?.email}</Text>
              <View style={styles.modalDivider} />
            </View>

            {/* BLOCK STATUS TOGGLE */}
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleStatusChange(selectedUser?.status === 'active' ? 'suspended' : 'active')}
            >
              <Ionicons
                name={selectedUser?.status === 'active' ? 'lock-closed-outline' : 'lock-open-outline'}
                size={20}
                color={selectedUser?.status === 'active' ? COLORS.error : COLORS.success}
              />
              <Text style={[styles.modalOptionText, selectedUser?.status === 'active' && { color: COLORS.error }]}>
                {selectedUser?.status === 'active' ? 'Khóa tài khoản thành viên' : 'Mở khóa tài khoản'}
              </Text>
            </TouchableOpacity>

            {/* PACKAGE UPGRADE/DOWNGRADE TOGGLE */}
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handlePackageChange(selectedUser?.package === 'premium' ? 'free' : 'premium')}
            >
              <Ionicons name="sparkles-outline" size={20} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>
                {selectedUser?.package === 'premium' ? 'Hạ cấp xuống gói Free' : 'Nâng cấp lên gói Premium'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />
            <Text style={styles.roleHeader}>Điều chỉnh phân quyền Admin:</Text>

            {/* ROLE SETS ROWS */}
            <View style={styles.roleActionsGrid}>
              {[
                { role: 'user', label: 'User thường' },
                { role: 'moderator', label: 'Moderator' },
                { role: 'analyst', label: 'Analyst' },
                { role: 'admin', label: 'Super Admin' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.role}
                  style={[
                    styles.roleBtn,
                    selectedUser?.role === r.role && styles.roleBtnActive,
                  ]}
                  onPress={() => handleRoleChange(r.role)}
                >
                  <Text style={[styles.roleBtnText, selectedUser?.role === r.role && styles.roleBtnTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[150] || '#e2e8f0',
    paddingTop: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.black,
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[500],
    width: 76,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: COLORS.gray[100],
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  chipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  centerSpinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE5D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 1,
  },
  userId: {
    fontSize: 10,
    color: COLORS.gray[400],
    marginTop: 2,
    fontWeight: '500',
  },
  userCardRight: {
    alignItems: 'flex-end',
  },
  badgeStyle: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgePremium: {
    backgroundColor: COLORS.primaryLight,
  },
  badgeFree: {
    backgroundColor: COLORS.gray[100],
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeSuspended: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextPremium: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  badgeTextFree: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gray[500],
  },
  badgeTextActive: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.success,
  },
  badgeTextSuspended: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.error,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray[400],
    fontSize: 13,
    marginTop: 40,
  },
  footerSpinner: {
    marginVertical: 12,
  },
  // Modal Bottom Actions Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    paddingBottom: 36,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '850',
    color: COLORS.black,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginVertical: 14,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  roleHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[500],
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  roleActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  roleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  roleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  roleBtnTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray[700],
  },
});

export default AdminUsersScreen;
