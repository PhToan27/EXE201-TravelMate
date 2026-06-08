import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as postApi from '../../services/community/postApi';
import { COLORS, RADIUS, SPACING } from '../../utils/constants';

const statusText = {
  pending: 'Đang chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
};

const statusColor = {
  pending: COLORS.warning,
  approved: COLORS.success,
  rejected: COLORS.error,
};

const MyPostsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await postApi.getMyPosts();
      if (result.success) setPosts(result.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Bài viết của tôi" onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.xl }]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPosts} colors={[COLORS.primary]} />}
        >
          {posts.map((post) => (
            <TouchableOpacity
              key={post._id}
              style={styles.card}
              onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}
            >
              <View style={styles.row}>
                <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
                <Text style={[styles.badge, { color: statusColor[post.status] || COLORS.gray[600] }]}>
                  {statusText[post.status] || post.status}
                </Text>
              </View>
              {!!post.rejectionReason && <Text style={styles.reason}>{post.rejectionReason}</Text>}
              <Text style={styles.meta}>{post.likesCount || 0} lượt thích • {post.commentsCount || 0} bình luận</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const Header = ({ title, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.back} onPress={onBack}><Ionicons name="arrow-back" size={22} color={COLORS.black} /></TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.back} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.white },
  back: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: COLORS.black },
  list: { padding: SPACING.md, gap: SPACING.sm },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: COLORS.black },
  badge: { fontSize: 12, fontWeight: '900' },
  reason: { marginTop: 6, color: COLORS.error, fontSize: 12 },
  meta: { marginTop: 8, color: COLORS.gray[500], fontSize: 12 },
});

export default MyPostsScreen;
