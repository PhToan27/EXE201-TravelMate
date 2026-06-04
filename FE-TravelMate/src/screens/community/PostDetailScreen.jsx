import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as postApi from '../../services/community/postApi';
import { COLORS, RADIUS, SPACING } from '../../utils/constants';

const PostDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { postId, post: initialPost } = route.params || {};
  const [post, setPost] = useState(initialPost);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(!initialPost);
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      try {
        const result = await postApi.getPostById(postId);
        if (result.success) setPost(result.data);
      } catch {
        Alert.alert('Không tải được bài viết', 'Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const counts = useMemo(() => ({
    likes: post?.likesCount ?? (Array.isArray(post?.likes) ? post.likes.length : post?.likes || 0),
    comments: post?.commentsCount ?? (Array.isArray(post?.comments) ? post.comments.length : post?.comments || 0),
    shares: post?.sharesCount ?? post?.shares ?? 0,
  }), [post]);

  const handleLike = async () => {
    try {
      const result = await postApi.toggleLikePost(post._id);
      if (result.success) setPost(result.data);
    } catch (error) {
      Alert.alert('Chưa thả tim được', error.response?.data?.message || 'Vui lòng đăng nhập rồi thử lại.');
    }
  };

  const handleFollow = async () => {
    const authorId = post?.author?._id;
    if (!authorId) return;

    try {
      const result = await postApi.toggleFollowAuthor(authorId);
      if (result.success) {
        setPost((current) => ({
          ...current,
          isFollowingAuthor: result.data.isFollowing,
        }));
      }
    } catch (error) {
      Alert.alert('Chưa follow được', error.response?.data?.message || 'Vui lòng đăng nhập rồi thử lại.');
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;

    setIsCommenting(true);
    try {
      const result = await postApi.addComment(post._id, comment.trim());
      if (result.success) {
        setPost(result.data);
        setComment('');
      }
    } catch (error) {
      Alert.alert('Chưa bình luận được', error.response?.data?.message || 'Vui lòng đăng nhập rồi thử lại.');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareResult = await Share.share({
        title: post.title,
        message: `${post.title}\n\n${post.excerpt || post.content || ''}`,
      });

      if (shareResult.action === Share.sharedAction) {
        const result = await postApi.sharePost(post._id);
        if (result.success) setPost(result.data);
      }
    } catch (error) {
      Alert.alert('Chưa chia sẻ được', 'Vui lòng thử lại sau.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài viết</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <Ionicons name="bookmark-outline" size={20} color={COLORS.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}>
        {!!post?.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.hero} />}
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{post?.category || 'Du lịch'}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.readTime}>{post?.readTime || '5 phút đọc'}</Text>
          </View>
          <Text style={styles.title}>{post?.title}</Text>

          <View style={styles.authorCard}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{post?.author?.name || 'TravelMate User'}</Text>
              <Text style={styles.authorSub}>Người chia sẻ trải nghiệm</Text>
            </View>
            <TouchableOpacity
              style={[styles.followButton, post?.isFollowingAuthor && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followText, post?.isFollowingAuthor && styles.followingText]}>
                {post?.isFollowingAuthor ? 'Đang theo dõi' : 'Theo dõi'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reactionRow}>
            <TouchableOpacity style={styles.reactionButton} onPress={handleLike}>
              <Ionicons name={post?.isLiked ? 'heart' : 'heart-outline'} size={20} color={post?.isLiked ? COLORS.error : COLORS.gray[600]} />
              <Text style={styles.reactionText}>{counts.likes}</Text>
            </TouchableOpacity>
            <View style={styles.reactionButton}>
              <Ionicons name="chatbubble-outline" size={19} color={COLORS.gray[600]} />
              <Text style={styles.reactionText}>{counts.comments}</Text>
            </View>
            <TouchableOpacity style={styles.reactionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={19} color={COLORS.gray[600]} />
              <Text style={styles.reactionText}>{counts.shares}</Text>
            </TouchableOpacity>
          </View>

          {(post?.content || '').split('\n').map((paragraph, index) => (
            <Text key={`${paragraph}-${index}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}

          <View style={styles.commentBox}>
            <Text style={styles.commentTitle}>Bình luận</Text>
            <View style={styles.commentInputRow}>
              <TextInput
                value={comment}
                onChangeText={setComment}
                style={styles.commentInput}
                placeholder="Viết bình luận..."
                placeholderTextColor={COLORS.gray[400]}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleComment} disabled={isCommenting}>
                <Ionicons name="send" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {(post?.comments || []).map((item) => (
              <View key={item._id || `${item.author?.name}-${item.createdAt}`} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Ionicons name="person" size={12} color={COLORS.primary} />
                </View>
                <View style={styles.commentBody}>
                  <Text style={styles.commentAuthor}>{item.author?.name || 'TravelMate User'}</Text>
                  <Text style={styles.commentContent}>{item.content}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  headerButton: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, width: 64, justifyContent: 'flex-end' },
  hero: { width: '100%', height: 300, backgroundColor: COLORS.gray[100] },
  content: { padding: SPACING.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  category: { fontSize: 11, color: COLORS.primary, fontWeight: '800', textTransform: 'uppercase' },
  dot: { color: COLORS.gray[400] },
  readTime: { fontSize: 12, color: COLORS.gray[500], fontWeight: '600' },
  title: { fontSize: 24, lineHeight: 31, fontWeight: '900', color: COLORS.black },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: { fontSize: 13, color: COLORS.black, fontWeight: '800' },
  authorSub: { fontSize: 11, color: COLORS.gray[500], marginTop: 2 },
  followButton: { backgroundColor: COLORS.primary, borderRadius: 18, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  followingButton: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary },
  followText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  followingText: { color: COLORS.primary },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    borderRadius: 18,
  },
  reactionText: { fontSize: 12, color: COLORS.gray[700], fontWeight: '800' },
  paragraph: { fontSize: 15, lineHeight: 25, color: COLORS.gray[700], marginBottom: SPACING.md },
  commentBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  commentTitle: { fontSize: 16, fontWeight: '900', color: COLORS.black, marginBottom: SPACING.sm },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  commentInput: {
    flex: 1,
    height: 42,
    backgroundColor: COLORS.background,
    borderRadius: 21,
    paddingHorizontal: SPACING.md,
    fontSize: 13,
    color: COLORS.black,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBody: { flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.sm },
  commentAuthor: { fontSize: 12, fontWeight: '800', color: COLORS.black, marginBottom: 3 },
  commentContent: { fontSize: 13, lineHeight: 18, color: COLORS.gray[700] },
});

export default PostDetailScreen;
