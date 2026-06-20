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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { getPlaceDetails, getNearbyPlaces } from '../../services/place/placeApi';
import useTrip from '../../hooks/useTrip';

const isDefaultDaNangCoordinate = (point) =>
  point &&
  Math.abs(Number(point.latitude) - 16.0544) < 0.0002 &&
  Math.abs(Number(point.longitude) - 108.2022) < 0.0002;

const getUsableCoordinates = (place) => {
  const latitude = Number(place?.coordinates?.lat ?? place?.latitude);
  const longitude = Number(place?.coordinates?.lng ?? place?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const point = { latitude, longitude };
  return isDefaultDaNangCoordinate(point) ? null : point;
};

const toPlaceCoordinates = (point) => ({
  lat: point.latitude,
  lng: point.longitude,
});

const mergePlaceDetails = (initialPlace, fetchedPlace) => {
  const initialCoordinates = getUsableCoordinates(initialPlace);
  const fetchedCoordinates = getUsableCoordinates(fetchedPlace);
  const coordinates = initialCoordinates || fetchedCoordinates;

  return {
    ...(initialPlace || {}),
    ...(fetchedPlace || {}),
    _id: initialPlace?._id || fetchedPlace?._id || fetchedPlace?.id,
    placeId: initialPlace?.placeId || initialPlace?._id || fetchedPlace?.placeId,
    coordinates: coordinates
      ? toPlaceCoordinates(coordinates)
      : fetchedPlace?.coordinates || initialPlace?.coordinates,
  };
};

const PlaceDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { placeName, tripId, place: initialPlace } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState(initialPlace || null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // useTrip integration
  const { currentTrip: trip, fetchTripById, updateTrip } = useTrip();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNearby = async (lat, lng, name) => {
    try {
      setLoadingNearby(true);
      const res = await getNearbyPlaces(lat, lng, name, 5);
      if (res.success) {
        setNearbyPlaces(res.data);
      }
    } catch (err) {
      console.error('Error fetching nearby places:', err);
    } finally {
      setLoadingNearby(false);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!initialPlace) setLoading(true);
        const res = await getPlaceDetails(placeName);
        if (res.success) {
          setPlace(mergePlaceDetails(initialPlace, res.data));
          const { lat, lng } = res.data.coordinates || {};
          if (lat && lng) {
            fetchNearby(lat, lng, res.data.name);
          }
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
  }, [initialPlace, placeName]);

  useEffect(() => {
    if (tripId) {
      fetchTripById(tripId);
    }
  }, [tripId]);

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

  const parsePriceNumber = (value) => {
    if (!value) return 0;
    const clean = String(value).toLowerCase();
    if (clean.includes('miễn phí') || clean.includes('free')) return 0;
    const match = clean.replace(/[.,\s]/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const handleAddToItinerary = () => {
    if (!tripId) {
      Alert.alert('Thông báo', 'Không xác định được chuyến đi hiện tại. Hãy truy cập từ trang chi tiết chuyến đi.');
      return;
    }
    if (!place) return;

    const cat = String(place.category || '').toLowerCase();
    if (cat.includes('khách sạn') || cat.includes('khach san') || cat.includes('hotel') || cat.includes('homestay') || cat.includes('resort')) {
      Alert.alert(
        'Thêm khách sạn',
        `Bạn có muốn chọn "${place.name}" làm nơi lưu trú cho chuyến đi không?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận',
            onPress: async () => {
              try {
                setIsSubmitting(true);
                const hotelRec = {
                  name: place.name,
                  address: place.address || '',
                  description: place.introduction || 'Nơi lưu trú được lựa chọn.',
                  estimatedCostPerNight: parsePriceNumber(place.ticketPrice) || 500000,
                  rating: place.rating || 4.5,
                  area: place.address || ''
                };
                const res = await updateTrip(tripId, { hotelRecommendation: hotelRec });
                if (res.success) {
                  Alert.alert('Thành công', `Đã đặt "${place.name}" làm khách sạn của chuyến đi!`);
                } else {
                  Alert.alert('Lỗi', res.message || 'Không thể cập nhật khách sạn.');
                }
              } catch (err) {
                Alert.alert('Lỗi', err.message);
              } finally {
                setIsSubmitting(false);
              }
            }
          }
        ]
      );
    } else if (cat.includes('ẩm thực') || cat.includes('am thuc') || cat.includes('nhà hàng') || cat.includes('quán ăn') || cat.includes('cafe')) {
      Alert.alert(
        'Thêm nhà hàng',
        'Bạn muốn thêm địa điểm ăn uống này vào danh sách nào?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Gợi ý ẩm thực',
            onPress: async () => {
              try {
                setIsSubmitting(true);
                const newRest = {
                  name: place.name,
                  address: place.address || '',
                  cuisineType: place.category || 'Ẩm thực địa phương',
                  averagePricePerPerson: parsePriceNumber(place.ticketPrice) || 120000,
                  rating: place.rating || 4.5,
                  description: place.introduction || 'Quán ăn ngon tự chọn.'
                };
                const currentRest = trip?.restaurantRecommendations || [];
                if (currentRest.some(r => r.name === place.name)) {
                  Alert.alert('Thông báo', 'Nhà hàng này đã có trong danh sách gợi ý.');
                  return;
                }
                const res = await updateTrip(tripId, {
                  restaurantRecommendations: [...currentRest, newRest]
                });
                if (res.success) {
                  Alert.alert('Thành công', `Đã thêm "${place.name}" vào danh sách gợi ý ẩm thực!`);
                } else {
                  Alert.alert('Lỗi', res.message || 'Không thể cập nhật.');
                }
              } catch (err) {
                Alert.alert('Lỗi', err.message);
              } finally {
                setIsSubmitting(false);
              }
            }
          },
          {
            text: 'Lịch trình hoạt động',
            onPress: () => {
              setSelectedDay(1);
              setSelectedTime('08:00');
              setModalVisible(true);
            }
          }
        ]
      );
    } else {
      setSelectedDay(1);
      setSelectedTime('08:00');
      setModalVisible(true);
    }
  };

  const handleConfirmAddActivity = async () => {
    if (!trip || !place) return;

    // Check for existing activity at the same day and time
    const conflictAct = (trip.activities || []).find(
      (act) => Number(act.day) === Number(selectedDay) && act.time === selectedTime
    );

    if (conflictAct) {
      Alert.alert(
        'Trùng lịch trình',
        `Khung giờ ${selectedTime} của Ngày ${selectedDay} đã có hoạt động "${conflictAct.location}". Bạn có muốn thay thế bằng "${place.name}" không?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Thay thế',
            onPress: () => performAddActivity(true)
          }
        ]
      );
    } else {
      performAddActivity(false);
    }
  };

  const performAddActivity = async (replaceExisting = false) => {
    try {
      setIsSubmitting(true);
      const ticketCost = parsePriceNumber(place.ticketPrice);
      
      const newAct = {
        day: selectedDay,
        time: selectedTime,
        location: place.name,
        address: place.address || '',
        description: place.introduction || '',
        cost: ticketCost,
        category: place.category === 'Ẩm thực' ? 'FOOD' : 'PLACE',
        transport: 'MOTORBIKE',
        durationMinutes: place.category === 'Ẩm thực' ? 60 : 90,
      };

      let updatedActivities = [...(trip.activities || [])];
      
      if (replaceExisting) {
        // Filter out the conflicting activity
        updatedActivities = updatedActivities.filter(
          (act) => !(Number(act.day) === Number(selectedDay) && act.time === selectedTime)
        );
      }

      updatedActivities.push(newAct);
      const res = await updateTrip(tripId, { activities: updatedActivities });
      
      if (res.success) {
        setModalVisible(false);
        Alert.alert('Thành công', `Đã thêm "${place.name}" vào lịch trình Ngày ${selectedDay}!`);
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể thêm vào lịch trình.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMap = () => {
    if (!place) return;
    const resolvedPlaceId = place._id || place.placeId;
    const navigationPoint = getUsableCoordinates(place);

    if (!navigationPoint && !resolvedPlaceId) {
      Alert.alert('Loi', 'Khong the lay toa do dia diem de xem duong di.');
      return;
    }

    navigation.navigate('NavigationDetail', {
      placeId: navigationPoint ? undefined : resolvedPlaceId,
      placeName: place.name || placeName,
      place: navigationPoint
        ? { ...place, coordinates: toPlaceCoordinates(navigationPoint) }
        : place,
      vehicle: 'motorcycle',
    });
    return;
    /*

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
    */
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
            <Text style={styles.badgeText}>{(place.category || 'Địa điểm').toUpperCase()}</Text>
            </View>
            <Text style={styles.placeName}>{place.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.locationSubtitle} numberOfLines={1}>
                {(place.address || '').split(',').slice(-3).join(',').trim()}
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
          <Text style={styles.introText}>{place.introduction || 'Chưa có mô tả cho địa điểm này.'}</Text>

          {/* Contact and timing blocks */}
          <View style={styles.detailBlock}>
            <View style={styles.detailRow}>
              <View style={[styles.iconBg, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailTitle}>ĐỊA CHỈ</Text>
                <Text style={styles.detailVal}>{place.address || 'Chưa có địa chỉ'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.iconBg, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailTitle}>GIỜ MỞ CỬA</Text>
                <Text style={styles.detailVal}>{place.openHours || 'Chưa có dữ liệu'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.iconBg, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailTitle}>GIÁ VÉ</Text>
                <Text style={styles.detailVal}>{place.ticketPrice || 'Chưa có dữ liệu'}</Text>
              </View>
            </View>
          </View>

          {/* AI Recommended Nearby Section */}
          {nearbyPlaces.length > 0 && (
            <View style={styles.nearbySection}>
              <View style={styles.nearbyHeader}>
                <Ionicons name="sparkles" size={18} color={COLORS.primary} />
                <Text style={styles.nearbyTitle}>AI Gợi ý địa điểm lân cận</Text>
              </View>
              <Text style={styles.nearbySubtitle}>Khám phá các điểm vui chơi & ẩm thực gần {place.name}:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.nearbyList}
              >
                {nearbyPlaces.map((np) => (
                  <TouchableOpacity
                    key={np._id}
                    style={styles.nearbyCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.push('PlaceDetail', { placeName: np.name, tripId })}
                  >
                    <Image
                      source={{ uri: np.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400' }}
                      style={styles.nearbyCardImage}
                    />
                    <View style={styles.nearbyCardBody}>
                      <Text style={styles.nearbyCardName} numberOfLines={1}>
                        {np.name}
                      </Text>
                      <View style={styles.nearbyCardRow}>
                        <Ionicons name="location-outline" size={11} color={COLORS.gray[400]} />
                        <Text style={styles.nearbyCardDist}>{np.distance} km</Text>
                        <Ionicons name="star" size={11} color={COLORS.warning} style={{ marginLeft: 6 }} />
                        <Text style={styles.nearbyCardRating}>{np.rating}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

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
              <Text style={styles.secondaryBtnText}>Xem đường đi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date & Time Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm vào lịch trình</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Chọn ngày và khung giờ bạn muốn đi tới {place?.name}:
            </Text>

            {/* Day Selection */}
            <Text style={styles.sectionTitle}>Chọn Ngày</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipList}
            >
              {Array.from({ length: trip?.totalDays || 3 }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDay === dayNum;
                return (
                  <TouchableOpacity
                    key={dayNum}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedDay(dayNum)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      Ngày {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Selection */}
            <Text style={styles.sectionTitle}>Chọn Khung Giờ</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipList}
            >
              {['08:00', '10:30', '14:30', '18:00'].map((time) => {
                const isSelected = selectedTime === time;
                
                // Check if this time slot on the selectedDay is already busy
                const isBusy = (trip?.activities || []).some(
                  (act) => Number(act.day) === Number(selectedDay) && act.time === time
                );

                const timeLabel = time === '08:00' ? 'Sáng (08:00)' :
                                  time === '10:30' ? 'Trưa (10:30)' :
                                  time === '14:30' ? 'Chiều (14:30)' : 'Tối (18:00)';
                
                const label = isBusy ? `${timeLabel} (Trùng)` : timeLabel;

                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.chip,
                      isSelected && styles.chipActive,
                      isBusy && !isSelected && { borderColor: COLORS.gray[300], backgroundColor: COLORS.gray[50] }
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[
                      styles.chipText,
                      isSelected && styles.chipTextActive,
                      isBusy && !isSelected && { color: COLORS.gray[400] }
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.confirmBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleConfirmAddActivity}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                  <Text style={styles.confirmBtnText}>Xác nhận thêm</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  nearbySection: {
    marginBottom: SPACING.lg,
  },
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  nearbyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.black,
  },
  nearbySubtitle: {
    fontSize: 12,
    color: COLORS.gray[550] || COLORS.gray[500],
    marginBottom: 12,
  },
  nearbyList: {
    gap: 12,
    paddingRight: SPACING.md,
  },
  nearbyCard: {
    width: 140,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  nearbyCardImage: {
    width: '100%',
    height: 85,
    backgroundColor: COLORS.gray[100],
  },
  nearbyCardBody: {
    padding: 8,
    gap: 4,
  },
  nearbyCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
  },
  nearbyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  nearbyCardDist: {
    fontSize: 10,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  nearbyCardRating: {
    fontSize: 10,
    color: COLORS.gray[600],
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  chipScroll: {
    flexGrow: 0,
    marginBottom: SPACING.sm,
  },
  chipList: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    minWidth: 70,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray[200],
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  cancelBtnText: {
    color: COLORS.gray[600],
    fontWeight: '600',
    fontSize: 15,
  },
});

export default PlaceDetailScreen;
