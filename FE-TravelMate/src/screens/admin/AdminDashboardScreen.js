import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';
import * as adminApi from '../../services/admin/adminApi';

const AdminDashboardScreen = ({ navigation }) => {
  const { logout, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchStats = async (showFullSpinner = false) => {
    try {
      if (showFullSpinner || !stats) {
        setLoading(true);
      }
      const res = await adminApi.getStats();
      if (res.success) {
        setStats(res.data);
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể lấy số liệu thống kê.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats(false);
    setRefreshing(false);
  };

  const handleQuickModerate = async (postId, action) => {
    try {
      const res = await adminApi.moderatePost(postId, action);
      if (res.success) {
        Alert.alert('Thành công', `Đã duyệt bài viết với hành động: ${action}`);
        fetchStats(); // Refresh dashboard
      } else {
        Alert.alert('Thất bại', res.message);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi yêu cầu duyệt.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất tài khoản quản trị viên?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải số liệu hệ thống...</Text>
      </View>
    );
  }

  // Fallbacks if data is empty
  const totalUsersVal = stats?.totalUsers || 0;
  const newTripsVal = stats?.newTrips || 0;
  const urgentReportsVal = stats?.urgentReports || 0;
  const growthData = stats?.userGrowth || [
    { label: 'Tuần 1', value: 8 },
    { label: 'Tuần 2', value: 14 },
    { label: 'Tuần 3', value: 11 },
    { label: 'Hôm nay', value: 18 }
  ];
  const recentPending = stats?.recentPending || [];

  // Calculate grid lines dynamically
  const values = growthData.map((d) => d.value);
  const maxVal = Math.max(...values, 10);
  const roundedMax = Math.ceil(maxVal / 5) * 5;
  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => roundedMax - (i * roundedMax) / gridSteps);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + SPACING.md }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>TravelMate</Text>
          <Text style={styles.headerSubtitle}>Quản trị hệ thống</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* METRIC STATS CARDS */}
      <View style={styles.statsRow}>
        {/* Card 1: Users */}
        <View style={styles.statCard}>
          <View style={[styles.iconWrapper, { backgroundColor: '#FFEDD5' }]}>
            <Ionicons name="people-outline" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.statLabel}>Tổng người dùng</Text>
          <Text style={styles.statValue}>
            {totalUsersVal >= 1000 ? `${(totalUsersVal / 1000).toFixed(1)}k` : totalUsersVal}
          </Text>
          <Text style={styles.statTrendGreen}>▲ Hoạt động</Text>
        </View>

        {/* Card 2: Trips */}
        <View style={styles.statCard}>
          <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="briefcase-outline" size={22} color="#D97706" />
          </View>
          <Text style={styles.statLabel}>Chuyến đi mới</Text>
          <Text style={styles.statValue}>
            {newTripsVal >= 1000 ? `${(newTripsVal / 1000).toFixed(1)}k` : newTripsVal}
          </Text>
          <Text style={styles.statTrendGray}>Tháng này</Text>
        </View>

        {/* Card 3: Urgent Reports */}
        <View style={[styles.statCard, styles.statCardUrgent]}>
          <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={22} color={COLORS.error} />
          </View>
          <Text style={styles.statLabel}>Báo cáo khẩn</Text>
          <Text style={[styles.statValue, { color: COLORS.error }]}>{urgentReportsVal}</Text>
          <Text style={styles.statTrendRed}>● Cần xử lý gấp</Text>
        </View>
      </View>

      {/* GROWTH CHART SECTION */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tăng trưởng người dùng</Text>
        <Text style={styles.cardSubtitleText}>Xu hướng đăng ký mới 30 ngày qua</Text>
        
        {/* Custom Visual Bar Chart with Grid Lines */}
        <View style={styles.chartWrapper}>
          {/* Y-Axis Labels */}
          <View style={styles.yAxisContainer}>
            {gridLines.map((val, idx) => (
              <Text key={idx} style={styles.yAxisLabel}>
                {Math.round(val)}
              </Text>
            ))}
          </View>

          {/* Chart Content Area */}
          <View style={styles.chartContentArea}>
            {/* Background Grid Lines */}
            <View style={styles.gridLinesBackground}>
              {gridLines.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.gridLineRow,
                    idx === gridLines.length - 1 && styles.gridLineRowBottom,
                  ]}
                />
              ))}
            </View>

            {/* Foreground Bars */}
            <View style={styles.barsContainer}>
              {growthData.map((item, index) => {
                const barHeightPercent = `${(item.value / roundedMax) * 100}%`;
                return (
                  <View key={index} style={styles.chartCol}>
                    <Text style={styles.chartBarValue}>{item.value}</Text>
                    <View style={styles.chartBarTrack}>
                      <LinearGradient
                        colors={[COLORS.primary, '#FED7AA']}
                        style={[styles.chartBarFill, { height: barHeightPercent }]}
                      />
                    </View>
                    <Text style={styles.chartBarLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* RECENT FOR REVIEW SECTION */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Kiểm duyệt cộng đồng</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Moderation')}>
            <Text style={styles.viewAllText}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        {recentPending.length === 0 ? (
          <Text style={styles.emptyText}>Không có bài đăng nào cần kiểm duyệt.</Text>
        ) : (
          recentPending.map((post) => (
            <View key={post._id} style={styles.postItem}>
              <View style={styles.postItemHeader}>
                <View style={styles.postAuthorBlock}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{post.author?.name?.charAt(0) || 'U'}</Text>
                  </View>
                  <View>
                    <Text style={styles.authorName}>{post.author?.name || 'Thành viên'}</Text>
                    <Text style={styles.postCategory}>{post.category || 'Kinh nghiệm'}</Text>
                  </View>
                </View>
                <View style={[styles.badgeStyle, post.reported ? styles.badgeReported : styles.badgePending]}>
                  <Text style={post.reported ? styles.badgeTextReported : styles.badgeTextPending}>
                    {post.reported ? 'Bị báo cáo' : 'Chờ duyệt'}
                  </Text>
                </View>
              </View>
              <Text style={styles.postTitle}>{post.title}</Text>
              <View style={styles.quickActionRow}>
                {post.reported ? (
                  <>
                    <TouchableOpacity
                      style={styles.approveBtnQuick}
                      onPress={() => handleQuickModerate(post._id, 'clear_report')}
                    >
                      <Text style={styles.approveBtnText}>Bỏ qua</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtnQuick}
                      onPress={() => handleQuickModerate(post._id, 'reject')}
                    >
                      <Text style={[styles.rejectBtnText, { color: COLORS.error }]}>Gỡ bài</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.approveBtnQuick}
                      onPress={() => handleQuickModerate(post._id, 'approve')}
                    >
                      <Text style={styles.approveBtnText}>Duyệt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtnQuick}
                      onPress={() => handleQuickModerate(post._id, 'reject')}
                    >
                      <Text style={styles.rejectBtnText}>Từ chối</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </View>
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
    paddingTop: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[150] || '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  statCardUrgent: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginVertical: 4,
  },
  statTrendGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  statTrendRed: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.error,
  },
  statTrendGray: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray[400],
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  cardSubtitleText: {
    fontSize: 11,
    color: COLORS.gray[400],
    marginTop: 2,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chartWrapper: {
    flexDirection: 'row',
    height: 180,
    marginTop: 8,
    paddingRight: 8,
  },
  yAxisContainer: {
    width: 28,
    height: 132,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingBottom: 2,
  },
  yAxisLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  chartContentArea: {
    flex: 1,
    height: 154,
    position: 'relative',
  },
  gridLinesBackground: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 124,
    justifyContent: 'space-between',
  },
  gridLineRow: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  gridLineRowBottom: {
    backgroundColor: '#CBD5E1',
    height: 1.5,
  },
  barsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarValue: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  chartBarTrack: {
    width: 20,
    height: 110,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  chartBarLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginTop: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.gray[400],
    textAlign: 'center',
    paddingVertical: 20,
  },
  postItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    paddingVertical: 14,
  },
  postItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAuthorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
  postCategory: {
    fontSize: 10,
    color: COLORS.gray[400],
    fontWeight: '500',
  },
  badgeStyle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePending: {
    backgroundColor: COLORS.gray[100],
  },
  badgeReported: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextPending: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  badgeTextReported: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.error,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    lineHeight: 18,
    marginBottom: 12,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtnQuick: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  rejectBtnQuick: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
});

export default AdminDashboardScreen;
