import React, { useEffect, useState } from 'react';
import {
  Image,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuth from '../../hooks/useAuth';
import useTrip from '../../hooks/useTrip';
import TripCard from '../../components/trip/TripCard';
import EmptyState from '../../components/common/EmptyState';
import * as postApi from '../../services/community/postApi';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

const featuredPlaces = [
  {
    name: 'Bà Nà Hills',
    location: 'Hòa Vang, Đà Nẵng',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Phố Cổ Hội An',
    location: 'Hội An, Quảng Nam',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Kinh thành Huế',
    location: 'Huế, Việt Nam',
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80',
  },
];

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { trips, isLoading, fetchTrips } = useTrip(true);
  const [posts, setPosts] = useState([]);

  const recentTrips = trips.slice(0, 3);
  const recentPosts = posts.slice(0, 3);
  const firstName = user?.name?.split(' ').pop() || 'bạn';

  useEffect(() => {
    const fetchCommunityPosts = async () => {
      try {
        const result = await postApi.getPosts();
        if (result.success) {
          setPosts(result.data || []);
        }
      } catch {
        setPosts([]);
      }
    };

    fetchCommunityPosts();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.lg }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={fetchTrips} colors={[COLORS.primary]} />
      }
    >
      <LinearGradient
        colors={['#F97316', '#FB923C']}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào, {firstName}</Text>
            <Text style={styles.headerSub}>Bạn muốn đi đâu hôm nay?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={40} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('SearchPlaces')}
          activeOpacity={0.9}
        >
          <Ionicons name="search-outline" size={18} color={COLORS.gray[400]} />
          <Text style={styles.searchPlaceholder}>Tìm kiếm điểm đến...</Text>
          <View style={styles.searchBtn}>
            <Ionicons name="options-outline" size={18} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.quickActions}>
        <QuickAction
          icon="add-circle"
          label="Tạo chuyến đi"
          color={COLORS.primary}
          onPress={() => navigation.navigate('CreateTrip')}
        />
        <QuickAction
          icon="bookmark"
          label="Đã lưu"
          color="#3B82F6"
          onPress={() => navigation.navigate('SavedTrips')}
        />
        <QuickAction
          icon="wallet"
          label="Ngân sách"
          color="#10B981"
          onPress={() => navigation.navigate('SavedTrips')}
        />
        <QuickAction
          icon="person"
          label="Hồ sơ"
          color="#8B5CF6"
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Địa điểm nổi bật</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SearchPlaces')}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRail}>
          {featuredPlaces.map((place) => (
            <TouchableOpacity
              key={place.name}
              style={styles.featuredCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('PlaceDetail', { placeName: place.name })}
            >
              <Image source={{ uri: place.imageUrl }} style={styles.featuredImage} />
              <View style={styles.featuredGradient} />
              <TouchableOpacity style={styles.featuredHeart}>
                <Ionicons name="heart-outline" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <View style={styles.featuredBody}>
                <Text style={styles.featuredName} numberOfLines={1}>{place.name}</Text>
                <View style={styles.featuredLocation}>
                  <Ionicons name="location-outline" size={12} color={COLORS.white} />
                  <Text style={styles.featuredLocationText} numberOfLines={1}>{place.location}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bài viết cộng đồng</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Community')}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.postRail}>
          {recentPosts.map((post) => (
            <TouchableOpacity
              key={post._id}
              style={styles.postCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}
            >
              <View style={styles.postImageWrap}>
                <Ionicons name="newspaper-outline" size={22} color={COLORS.white} style={styles.postImageIcon} />
                <Text style={styles.postImageLabel} numberOfLines={1}>{post.category || 'Du lịch'}</Text>
              </View>
              <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
              <Text style={styles.postMeta} numberOfLines={1}>
                {post.author?.name || 'TravelMate'} • {post.readTime || '3 phút đọc'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chuyến đi gần đây</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SavedTrips')}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {trips.length === 0 ? (
          <EmptyState
            icon="airplane-outline"
            title="Chưa có chuyến đi nào"
            subtitle="Tạo chuyến đi đầu tiên của bạn và trải nghiệm lập kế hoạch thông minh với AI"
            action={
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateTrip')}
              >
                <LinearGradient
                  colors={['#F97316', '#EA6C0A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createGradient}
                >
                  <Ionicons name="add" size={20} color={COLORS.white} />
                  <Text style={styles.createText}>Tạo chuyến đi</Text>
                </LinearGradient>
              </TouchableOpacity>
            }
          />
        ) : (
          recentTrips.map((trip) => (
            <TripCard
              key={trip._id}
              trip={trip}
              onPress={() => navigation.navigate('TripDetail', { tripId: trip._id })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const QuickAction = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={qaStyles.item} onPress={onPress} activeOpacity={0.8}>
    <View style={[qaStyles.iconWrap, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={qaStyles.label}>{label}</Text>
  </TouchableOpacity>
);

const qaStyles = StyleSheet.create({
  item: { alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 12, color: COLORS.gray[600], fontWeight: '500', textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  profileBtn: {
    opacity: 0.9,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: SPACING.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[400],
  },
  searchBtn: {
    padding: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  featuredRail: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  featuredCard: {
    width: 170,
    height: 220,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  featuredHeart: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBody: {
    position: 'absolute',
    left: SPACING.sm,
    right: SPACING.sm,
    bottom: SPACING.sm,
  },
  featuredName: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '900',
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  featuredLocationText: {
    flex: 1,
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  postRail: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  postCard: {
    width: 220,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  postImageWrap: {
    height: 92,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  postImageIcon: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    opacity: 0.85,
  },
  postImageLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  postTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.black,
    fontWeight: '800',
  },
  postMeta: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 6,
  },
  createBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
  },
  createText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default HomeScreen;
