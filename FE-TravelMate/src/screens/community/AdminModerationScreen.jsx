import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as postApi from '../../services/community/postApi';
import { COLORS, RADIUS, SPACING } from '../../utils/constants';

const AdminModerationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await postApi.getAdminPosts({ status: 'pending' });
      if (result.success) setPosts(result.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const updateStatus = async (id, status) => {
    const result = await postApi.updatePostStatus(id, { status, reason: status === 'rejected' ? 'Không phù hợp quy tắc cộng đồng.' : '' });
    if (result.success) {
      Alert.alert('Đã cập nhật', status === 'approved' ? 'Bài viết đã được duyệt.' : 'Bài viết đã bị từ chối.');
      fetchPosts();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Duyệt bài viết" onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.xl }]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPosts} colors={[COLORS.primary]} />}
        >
          {posts.map((post) => (
            <View key={post._id} style={styles.card}>
              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.meta}>{post.author?.name} • {post.moderation?.status}</Text>
              <Text style={styles.excerpt}>{post.excerpt || post.content}</Text>
              {!!post.moderation?.reasons?.length && <Text style={styles.reason}>{post.moderation.reasons.join('\n')}</Text>}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.button, styles.approve]} onPress={() => updateStatus(post._id, 'approved')}>
                  <Text style={styles.buttonText}>Duyệt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.reject]} onPress={() => updateStatus(post._id, 'rejected')}>
                  <Text style={styles.buttonText}>Từ chối</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  title: { fontSize: 15, fontWeight: '900', color: COLORS.black },
  meta: { marginTop: 4, fontSize: 12, color: COLORS.gray[500] },
  excerpt: { marginTop: 8, fontSize: 13, color: COLORS.gray[700], lineHeight: 19 },
  reason: { marginTop: 8, fontSize: 12, color: COLORS.warning },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  button: { flex: 1, borderRadius: RADIUS.sm, paddingVertical: 10, alignItems: 'center' },
  approve: { backgroundColor: COLORS.success },
  reject: { backgroundColor: COLORS.error },
  buttonText: { color: COLORS.white, fontWeight: '900' },
});

export default AdminModerationScreen;
