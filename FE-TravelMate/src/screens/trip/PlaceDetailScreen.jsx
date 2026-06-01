import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { getPlaceDetails } from '../../services/place/placeApi';

const PlaceDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { placeName } = route.params;
  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await getPlaceDetails(placeName);
        if (res.success) {
          setPlace(res.data);
        } else {
          Alert.alert('Lỗi', 'Không thể lấy thông tin địa điểm.');
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [placeName]);

  const handleShare = async () => {
    if (!place) return;
    try {
      await Share.share({
        message: `Khám phá địa điểm: ${place.name} - ${place.address}. Chi tiết mở cửa: ${place.openHours}.`,
        title: place.name,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddToItinerary = () => {
    Alert.alert('Thêm vào lịch trình', `Bạn đã thêm "${place?.name || placeName}" vào lịch trình thành công!`);
  };

  const handleOpenMap = () => {
    if (!place) return;
    const { lat, lng } = place.coordinates || {};
    const address = place.address || placeName;
    
    // Open Google Maps app using URL Scheme
    const url = lat && lng 
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Lỗi', 'Không thể mở ứng dụng Bản đồ.');
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết địa điểm...</Text>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Không tìm thấy thông tin địa điểm.</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: place.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          {/* Black gradient overlay for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
            style={styles.gradientOverlay}
          />
          
          {/* Title and Category info overlay */}
          <View style={styles.titleOverlay}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{place.category.toUpperCase()}</Text>
            </View>
            <Text style={styles.placeName}>{place.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.locationSubtitle} numberOfLines={1}>
                {place.address.split(',').slice(-3).join(',').trim()}
              </Text>
            </View>
          </View>
        </View>

        {/* Floating Stats Block */}
        <View style={styles.statsCardRow}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={20} color={COLORS.warning} />
            <Text style={styles.statLabel}>Đánh giá</Text>
            <Text style={styles.statVal}>{place.rating} ({place.reviewsCount})</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="time" size={20} color={COLORS.info} />
            <Text style={styles.statLabel}>Thời lượng</Text>
            <Text style={styles.statVal}>{place.duration}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="ribbon" size={20} color={COLORS.success} />
            <Text style={styles.statLabel}>Độ khó</Text>
            <Text style={styles.statVal}>{place.difficulty}</Text>
          </View>
        </View>

        {/* Details Content */}
        <View style={styles.contentBody}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <Text style={styles.introText}>{place.introduction}</Text>

          {/* Contact and timing blocks */}
          <View style={styles.detailBlock}>
            <View style={styles.detailRow}>
              <View style={[styles.iconBg, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailTitle}>ĐỊA CHỈ</Text>
                <Text style={styles.detailVal}>{place.address}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.iconBg, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailTitle}>GIỜ MỞ CỬA</Text>
                <Text style={styles.detailVal}>{place.openHours}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.iconBg, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailTitle}>GIÁ VÉ</Text>
                <Text style={styles.detailVal}>{place.ticketPrice}</Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddToItinerary}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>Thêm vào lịch trình</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleOpenMap}
            >
              <Ionicons name="map-outline" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>Xem trên bản đồ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Header Buttons (Back / Share) */}
      <View style={[styles.headerFloating, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circularBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backBtnError: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  backBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    height: 380,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444', // Red-Orange badge for national park/landmark
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  placeName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  headerFloating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    zIndex: 10,
  },
  circularBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsCardRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: -20, // Float card over banner
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.gray[200],
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.gray[400],
    fontWeight: '600',
  },
  statVal: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: '700',
  },
  contentBody: {
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  detailBlock: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gray[400],
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
    lineHeight: 18,
  },
  btnRow: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default PlaceDetailScreen;
