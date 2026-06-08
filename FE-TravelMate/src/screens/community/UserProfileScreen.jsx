import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as postApi from '../../services/community/postApi';
import { COLORS, RADIUS, SPACING } from '../../utils/constants';

const UserProfileScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { userId } = route.params || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const result = await postApi.getUserProfile(userId);
      if (result.success) setProfile(result.data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const toggleFollow = async () => {
    const result = await postApi.toggleFollowAuthor(userId);
    if (result.success) fetchProfile();
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const user = profile?.user;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Hồ sơ" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Ionicons name="person" size={28} color={COLORS.primary} /></View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.stats}>
            <Text style={styles.stat}>{user?.followersCount || 0} người theo dõi</Text>
            <Text style={styles.stat}>{user?.followingCount || 0} đang follow</Text>
          </View>
          <TouchableOpacity style={styles.followButton} onPress={toggleFollow}>
            <Text style={styles.followText}>{user?.isFollowing ? 'Bỏ theo dõi' : 'Theo dõi'}</Text>
          </TouchableOpacity>
        </View>

        <Section title="Bài đã đăng" />
        {(profile?.posts || []).map((post) => (
          <TouchableOpacity key={post._id} style={styles.postCard} onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.meta}>{post.likesCount || 0} lượt thích • {post.commentsCount || 0} bình luận</Text>
          </TouchableOpacity>
        ))}

        <Section title="Follower" />
        {(user?.followers || []).map((item) => <Text key={item._id} style={styles.person}>{item.name} • {item.email}</Text>)}

        <Section title="Đang follow" />
        {(user?.following || []).map((item) => <Text key={item._id} style={styles.person}>{item.name} • {item.email}</Text>)}
      </ScrollView>
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

const Section = ({ title }) => <Text style={styles.sectionTitle}>{title}</Text>;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.white },
  back: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: COLORS.black },
  content: { padding: SPACING.md, gap: SPACING.sm },
  profileCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  name: { marginTop: SPACING.sm, fontSize: 18, fontWeight: '900', color: COLORS.black },
  email: { fontSize: 12, color: COLORS.gray[500], marginTop: 3 },
  stats: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  stat: { fontSize: 12, color: COLORS.gray[700], fontWeight: '800' },
  followButton: { marginTop: SPACING.md, backgroundColor: COLORS.primary, borderRadius: 18, paddingHorizontal: SPACING.lg, paddingVertical: 9 },
  followText: { color: COLORS.white, fontWeight: '900' },
  sectionTitle: { marginTop: SPACING.md, fontSize: 15, fontWeight: '900', color: COLORS.black },
  postCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md },
  postTitle: { fontSize: 14, fontWeight: '800', color: COLORS.black },
  meta: { marginTop: 6, color: COLORS.gray[500], fontSize: 12 },
  person: { backgroundColor: COLORS.white, borderRadius: RADIUS.sm, padding: SPACING.sm, color: COLORS.gray[700] },
});

export default UserProfileScreen;
