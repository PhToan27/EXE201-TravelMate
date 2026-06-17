import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuth from '../../hooks/useAuth';
import * as postApi from '../../services/community/postApi';
import { COLORS, RADIUS, SPACING } from '../../utils/constants';

const tabs = ['Mới nhất', 'Xu hướng', 'Theo dõi', 'Thách thức'];
const feedMap = {
  'Mới nhất': 'latest',
  'Xu hướng': 'trending',
  'Theo dõi': 'following',
  'Thách thức': 'challenge',
};

const CommunityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'Mới nhất', image: null });

  const canManageChallenges = ['admin', 'moderator'].includes(user?.role);

  const fetchPosts = useCallback(async (refreshing = false, feed = 'latest') => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try {
      const result = await postApi.getPosts(feed === 'latest' ? {} : { feed });
      if (result.success) {
        setPosts(result.data || []);
      }
    } catch (error) {
      Alert.alert('Không tải được bài viết', error.response?.data?.message || 'Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(false, feedMap[activeTab] || 'latest');
  }, [fetchPosts, activeTab]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền ảnh', 'Bạn cần cho phép truy cập thư viện ảnh để đăng bài.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]) {
      setForm((current) => ({ ...current, image: result.assets[0] }));
    }
  };

  const submitPost = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Thiếu thông tin', 'Bạn cần nhập tiêu đề và nội dung bài viết.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await postApi.createPost({
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        image: form.image,
      });

      if (result.success) {
        setForm({ title: '', content: '', category: 'Mới nhất', image: null });
        setIsComposerOpen(false);
        Alert.alert('Đã gửi bài', result.message || 'Bài viết của bạn đang được phê duyệt');
        fetchPosts(true, feedMap[activeTab] || 'latest');
      }
    } catch (error) {
      Alert.alert('Chưa đăng được bài', error.response?.data?.message || 'Kiểm tra Cloudinary/env rồi thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="compass" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.brandText}>Cộng đồng</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('MyPosts')}>
            <Ionicons name="document-text-outline" size={22} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.black} />
          </TouchableOpacity>
          {canManageChallenges && (
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('AdminModeration')}>
              <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconButton} onPress={() => setIsComposerOpen(true)}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.feed, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchPosts(true, feedMap[activeTab] || 'latest')} colors={[COLORS.primary]} />
          }
        >
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color={COLORS.gray[400]} />
              <Text style={styles.emptyText}>Chưa có bài viết nào ở mục này.</Text>
            </View>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}
                onAuthorPress={() => navigation.navigate('UserProfile', { userId: post.author?._id })}
              />
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={isComposerOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={{ paddingTop: insets.top + SPACING.md }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsComposerOpen(false)} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đăng bài viết</Text>
            <TouchableOpacity onPress={submitPost} disabled={isSubmitting}>
              <Text style={styles.publishText}>{isSubmitting ? 'Đang đăng...' : 'Đăng'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.85}>
            {form.image?.uri ? (
              <Image source={{ uri: form.image.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePickerEmpty}>
                <Ionicons name="image-outline" size={30} color={COLORS.primary} />
                <Text style={styles.imagePickerText}>Chọn ảnh từ máy</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(title) => setForm((current) => ({ ...current, title }))}
            placeholder="Tiêu đề bài viết"
            placeholderTextColor={COLORS.gray[400]}
          />
          <TextInput
            style={[styles.input, styles.contentInput]}
            value={form.content}
            onChangeText={(content) => setForm((current) => ({ ...current, content }))}
            placeholder="Chia sẻ trải nghiệm du lịch của bạn..."
            placeholderTextColor={COLORS.gray[400]}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </Modal>
    </View>
  );
};

const PostCard = ({ post, onPress, onAuthorPress }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
    {!!post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.cover} />}
    <TouchableOpacity style={styles.authorRow} onPress={onAuthorPress}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={14} color={COLORS.primary} />
      </View>
      <View>
        <Text style={styles.authorName}>{post.author?.name || 'TravelMate User'}</Text>
      </View>
    </TouchableOpacity>
    <Text style={styles.cardTitle}>{post.title}</Text>
    <Text style={styles.excerpt} numberOfLines={2}>{post.excerpt || post.content}</Text>
    <View style={styles.cardFooter}>
      <View style={styles.stats}>
        <Ionicons name={post.isLiked ? 'heart' : 'heart-outline'} size={16} color={post.isLiked ? COLORS.error : COLORS.gray[500]} />
        <Text style={styles.statText}>{formatCount(post.likesCount ?? post.likes)}</Text>
        <Ionicons name="chatbubble-outline" size={15} color={COLORS.gray[500]} />
        <Text style={styles.statText}>{post.commentsCount ?? post.comments?.length ?? 0}</Text>
        <Ionicons name="share-social-outline" size={15} color={COLORS.gray[500]} />
        <Text style={styles.statText}>{post.sharesCount ?? post.shares ?? 0}</Text>
      </View>
      <Text style={styles.detailText}>Xem chi tiết</Text>
    </View>
  </TouchableOpacity>
);

const formatCount = (count = 0) => {
  const value = Array.isArray(count) ? count.length : Number(count || 0);
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconButton: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabText: { fontSize: 12, color: COLORS.gray[500], fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  feed: { padding: SPACING.md, gap: SPACING.md },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyText: { color: COLORS.gray[500], fontWeight: '600' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cover: { width: '100%', height: 190, borderRadius: RADIUS.md, backgroundColor: COLORS.gray[100] },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black, marginTop: SPACING.sm },
  excerpt: { fontSize: 12, color: COLORS.gray[600], lineHeight: 18, marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 11, color: COLORS.gray[500], marginRight: 8 },
  detailText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.md },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  cancelText: { fontSize: 14, color: COLORS.gray[600], fontWeight: '700' },
  publishText: { fontSize: 14, color: COLORS.primary, fontWeight: '800' },
  imagePicker: {
    height: 190,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  imagePickerEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  imagePickerText: { fontSize: 13, color: COLORS.primary, fontWeight: '800' },
  previewImage: { width: '100%', height: '100%' },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 14,
    color: COLORS.black,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  contentInput: { height: 220 },
});

export default CommunityScreen;
