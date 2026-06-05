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
    // Actions based on active tab
    let actionControls;
    if (activeTab === 'pending') {
      actionControls = (
        <View style={styles.cardActionsContainer}>
          <View style={styles.cardActionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleModerate(item._id, 'approve')}>
              <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.approveBtnText}>Phê duyệt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleModerate(item._id, 'reject')}>
              <Ionicons name="close-circle-outline" size={14} color={COLORS.error} style={{ marginRight: 4 }} />
              <Text style={styles.rejectBtnText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => Alert.alert('Thông báo', 'Đã gửi yêu cầu chỉnh sửa!')}
          >
            <Ionicons name="create-outline" size={14} color={COLORS.gray[500]} style={{ marginRight: 4 }} />
            <Text style={styles.editBtnText}>Yêu cầu chỉnh sửa</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (activeTab === 'approved') {
      actionControls = (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn, { flex: 1 }]} onPress={() => handleModerate(item._id, 'reject')}>
            <Ionicons name="trash-outline" size={14} color={COLORS.error} style={{ marginRight: 4 }} />
            <Text style={styles.rejectBtnText}>Thu hồi / Gỡ bài viết này</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (activeTab === 'reported') {
      actionControls = (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.approveBtn, { flex: 1 }]} onPress={() => handleModerate(item._id, 'clear_report')}>
            <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
            <Text style={styles.approveBtnText}>Bỏ qua báo cáo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn, { flex: 1 }]} onPress={() => handleModerate(item._id, 'reject')}>
            <Ionicons name="close-circle-outline" size={14} color={COLORS.error} style={{ marginRight: 4 }} />
            <Text style={styles.rejectBtnText}>Gỡ bài viết</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.postCard}>
        {/* Split Left Cover Image */}
        <View style={styles.cardImageWrapper}>
          <Image
            source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=300' }}
            style={styles.cardImage}
          />
        </View>

        {/* Split Right Content */}
        <View style={styles.cardContent}>
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

          {/* Title & Excerpt */}
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardExcerpt} numberOfLines={3}>{item.excerpt || item.content}</Text>
          
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
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardImageWrapper: {
    width: 110,
    backgroundColor: COLORS.gray[100],
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  authorNameWrapper: {
    flex: 1,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  authorName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  postDate: {
    fontSize: 9,
    color: COLORS.gray[400],
    marginTop: 1,
  },
  cardCategoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardExcerpt: {
    fontSize: 11,
    color: COLORS.gray[500],
    lineHeight: 15,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginBottom: 10,
  },
  cardActionsContainer: {
    width: '100%',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
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
    marginTop: 6,
  },
  approveBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  rejectBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.error,
  },
  editBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray[650] || '#475569',
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
