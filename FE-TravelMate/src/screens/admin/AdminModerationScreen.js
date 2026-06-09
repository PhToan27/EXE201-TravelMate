import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import * as adminApi from '../../services/admin/adminApi';

const AdminModerationScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Segment tab state
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'reported'
  const [tabCounts, setTabCounts] = useState({ pending: 0, approved: 0, reported: 0 });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  // State to track expanded posts
  const [expandedPosts, setExpandedPosts] = useState({});

  const toggleExpand = (postId) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const fetchCounts = async () => {
    try {
      const res = await adminApi.getStats();
      if (res.success) {
        setTabCounts({
          pending: res.data.pendingCount || 0,
          approved: res.data.approvedCount || 0,
          reported: res.data.reportedCount || 0,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPosts = async (pageNum = 1, isLoadMore = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await adminApi.getPosts(activeTab, pageNum);
      if (res.success) {
        const { posts: fetchedPosts, total, pages } = res.data;
        if (isLoadMore) {
          setPosts((prev) => [...prev, ...fetchedPosts]);
        } else {
          setPosts(fetchedPosts);
        }
        setTotalPosts(total);
        setTotalPages(pages);
        setPage(pageNum);
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể lấy bài viết.');
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
    fetchPosts(1, false);
    fetchCounts();
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(1, false);
    fetchCounts();
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchPosts(page + 1, true);
    }
  };

  const handleModerate = async (postId, action) => {
    try {
      const res = await adminApi.moderatePost(postId, action);
      if (res.success) {
        Alert.alert('Thành công', 'Đã lưu quyết định kiểm duyệt bài đăng!');
        fetchPosts(1, false); // Reload active tab
        fetchCounts(); // Update badges counts
      } else {
        Alert.alert('Thất bại', res.message);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ.');
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${Math.max(1, diffMins)} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else {
      return `${diffDays} ngày trước`;
    }
  };

  const renderPostCard = ({ item }) => {
    const isExpanded = !!expandedPosts[item._id];

    // Actions based on active tab
    let actionControls;
    if (activeTab === 'pending') {
      actionControls = (
        <View style={styles.cardActionsContainer}>
          <View style={styles.cardActionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleModerate(item._id, 'approve')}>
              <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.approveBtnText}>Phê duyệt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleModerate(item._id, 'reject')}>
              <Ionicons name="close-circle-outline" size={16} color={COLORS.error} style={{ marginRight: 6 }} />
              <Text style={styles.rejectBtnText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => Alert.alert('Thông báo', 'Đã gửi yêu cầu chỉnh sửa!')}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.gray[500]} style={{ marginRight: 6 }} />
            <Text style={styles.editBtnText}>Yêu cầu chỉnh sửa</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (activeTab === 'approved') {
      actionControls = (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn, { flex: 1 }]} onPress={() => handleModerate(item._id, 'reject')}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} style={{ marginRight: 6 }} />
            <Text style={styles.rejectBtnText}>Thu hồi / Gỡ bài viết này</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (activeTab === 'reported') {
      actionControls = (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.approveBtn, { flex: 1 }]} onPress={() => handleModerate(item._id, 'clear_report')}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={styles.approveBtnText}>Bỏ qua báo cáo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn, { flex: 1 }]} onPress={() => handleModerate(item._id, 'reject')}>
            <Ionicons name="close-circle-outline" size={16} color={COLORS.error} style={{ marginRight: 6 }} />
            <Text style={styles.rejectBtnText}>Gỡ bài viết</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.postCard}>
        {/* Author Block */}
        <View style={styles.authorRow}>
          <View style={styles.authorMeta}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{item.author?.name?.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.authorNameWrapper}>
              <Text style={styles.authorName} numberOfLines={1}>{item.author?.name || 'Thành viên'}</Text>
              <Text style={styles.postDate}>{getTimeAgo(item.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.cardCategoryBadge}>
            <Text style={styles.cardCategoryText}>{item.category || 'Kinh nghiệm'}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle}>{item.title}</Text>

        {/* Full Width Cover Image */}
        {!!item.imageUrl && (
          <View style={styles.cardImageWrapper}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.cardImage}
            />
          </View>
        )}

        {/* Content Section */}
        <View style={styles.cardContent}>
          {isExpanded ? (
            <View style={styles.fullContentContainer}>
              {(item.content || item.excerpt || '').split('\n').map((paragraph, index) => {
                if (!paragraph.trim()) return null;
                return (
                  <Text key={index} style={styles.paragraph}>
                    {paragraph}
                  </Text>
                );
              })}
            </View>
          ) : (
            <Text style={styles.cardExcerpt} numberOfLines={3}>
              {item.excerpt || item.content}
            </Text>
          )}

          {/* Expand/Collapse Toggle Button */}
          <TouchableOpacity
            style={styles.toggleExpandBtn}
            onPress={() => toggleExpand(item._id)}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleExpandText}>
              {isExpanded ? 'Thu gọn chi tiết' : 'Xem thêm chi tiết bài viết'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.primary}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Moderation Controls */}
          {actionControls}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* SEGMENT HEADERS TABS */}
      <View style={[styles.tabHeader, { paddingTop: insets.top + 8 }]}>
        {[
          { tab: 'pending', label: 'Chờ duyệt', count: tabCounts.pending },
          { tab: 'approved', label: 'Đã đăng', count: tabCounts.approved },
          { tab: 'reported', label: 'Bị báo cáo', count: tabCounts.reported },
        ].map((item) => (
          <TouchableOpacity
            key={item.tab}
            style={[styles.tabButton, activeTab === item.tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(item.tab)}
          >
            <View style={styles.tabLabelRow}>
              <Text style={[styles.tabText, activeTab === item.tab && styles.tabTextActive]}>
                {item.label}
              </Text>
              {item.count > 0 && (
                <View style={[
                  styles.tabBadge,
                  item.tab === 'reported' ? styles.tabBadgeReported : styles.tabBadgePending
                ]}>
                  <Text style={styles.tabBadgeText}>{item.count}</Text>
                </View>
              )}
            </View>
            {activeTab === item.tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENT LIST */}
      {loading ? (
        <View style={styles.centerSpinner}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderPostCard}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không có bài đăng nào trong mục này.</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.footerSpinner} />
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    paddingTop: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabButtonActive: {
    // Active style
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[400],
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  tabBadgePending: {
    backgroundColor: COLORS.primary,
  },
  tabBadgeReported: {
    backgroundColor: COLORS.error,
  },
  tabBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '800',
  },
  centerSpinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  postCard: {
    flexDirection: 'column',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  authorNameWrapper: {
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
  postDate: {
    fontSize: 10,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  cardCategoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  cardCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.black,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  cardImageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
    marginBottom: SPACING.sm,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
  },
  cardExcerpt: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  fullContentContainer: {
    marginBottom: SPACING.xs,
  },
  paragraph: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 18,
    marginBottom: 8,
  },
  toggleExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  toggleExpandText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginBottom: SPACING.sm,
  },
  cardActionsContainer: {
    width: '100%',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  rejectBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: COLORS.white,
  },
  editBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: COLORS.white,
    marginTop: 8,
  },
  approveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  rejectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.gray[400],
    textAlign: 'center',
    paddingVertical: 20,
  },
  footerSpinner: {
    marginVertical: 12,
  },
});

export default AdminModerationScreen;
