import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  Dimensions,
  ActivityIndicator,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as journalApi from '../../services/journal/journalApi';
import { COLORS, SPACING, RADIUS, FONTS } from '../../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EMOTIONS = {
  '😊': 'Vui vẻ',
  '😍': 'Hạnh phúc',
  '🤩': 'Tuyệt vời',
  '😌': 'Thư giãn',
  '😢': 'Buồn',
  '😴': 'Mệt nhưng đáng nhớ',
};

const TripJournalDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { journalId } = route.params;
  const [journal, setJournal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fullscreen Viewer State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    loadJournalDetails();
  }, [journalId]);

  const loadJournalDetails = async () => {
    try {
      setIsLoading(true);
      const res = await journalApi.getJournalById(journalId);
      if (res.success) {
        setJournal(res.data);
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể tải chi tiết nhật ký.');
        navigation.goBack();
      }
    } catch (err) {
      console.error('Error loading journal details:', err);
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareImage = async (url) => {
    try {
      await Share.share({
        message: `Xem bức ảnh tuyệt đẹp này từ chuyến đi của tôi: ${url}`,
        url: url,
      });
    } catch (err) {
      console.error('Error sharing image:', err);
    }
  };

  const handleOpenBrowser = async (url) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      console.error('Error opening browser:', err);
    }
  };

  const handleShareJournal = async () => {
    if (!journal) return;
    try {
      await Share.share({
        title: journal.title,
        message: `📔 ${journal.title}\n📅 Ngày: ${new Date(journal.journalDate).toLocaleDateString('vi-VN')}\n🎭 Cảm xúc: ${journal.emotion} ${EMOTIONS[journal.emotion] || ''}\n\n${journal.content}\n\nXem thêm trên TravelMate!`,
      });
    } catch (err) {
      console.error('Error sharing journal:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang mở cuốn album kỷ niệm...</Text>
      </View>
    );
  }

  if (!journal) return null;

  const images = journal.imageUrls || [];
  const coverImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800';
  const journalDate = new Date(journal.journalDate);
  const trip = journal.tripId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Back and Action Buttons */}
      <View style={[styles.headerContainer, { top: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleShareJournal} style={styles.headerBtn}>
            <Ionicons name="share-social-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('TripJournal', { tripId: journal.tripId?._id || journal.tripId })} 
            style={styles.headerBtn}
          >
            <Ionicons name="journal-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Section */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: coverImage }} style={styles.coverImage} />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(15,23,42,0.95)']}
            style={styles.coverGradient}
          />
          <View style={styles.coverContent}>
            <View style={styles.badgeRow}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>KỶ NIỆM</Text>
              </View>
              {!!journal.emotion && (
                <View style={styles.emotionBadge}>
                  <Text style={styles.emotionBadgeText}>
                    {journal.emotion} {EMOTIONS[journal.emotion] || ''}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.titleText}>{journal.title}</Text>
            <Text style={styles.dateText}>
              📅 {journalDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Blog Post Content */}
        <View style={styles.blogContainer}>
          <Text style={styles.contentText}>{journal.content}</Text>

          {/* Photo Gallery Title */}
          {images.length > 0 && (
            <View style={styles.galleryHeader}>
              <View style={styles.galleryLine} />
              <Text style={styles.galleryTitle}>ALBUM ẢNH ({images.length})</Text>
              <View style={styles.galleryLine} />
            </View>
          )}

          {/* Photo Grid */}
          {images.length > 0 && (
            <View style={styles.photoGrid}>
              {images.map((img, index) => {
                let gridStyle = styles.gridImageItem;
                if (images.length === 1) {
                  gridStyle = styles.gridImageItemFull;
                } else if (images.length === 3 && index === 0) {
                  gridStyle = styles.gridImageItemWide;
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={gridStyle}
                    activeOpacity={0.9}
                    onPress={() => {
                      setViewerIndex(index);
                      setViewerVisible(true);
                    }}
                  >
                    <Image source={{ uri: img }} style={styles.gridImage} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Trip Summary Card */}
          {trip && (
            <View style={styles.tripCard}>
              <LinearGradient
                colors={['#FFF7ED', '#FFEDD5']}
                style={styles.tripCardGradient}
              />
              <View style={styles.tripCardContent}>
                <View style={styles.tripCardHeader}>
                  <Ionicons name="navigate-circle" size={24} color={COLORS.primary} />
                  <Text style={styles.tripCardTitle}>Thuộc chuyến đi</Text>
                </View>
                <Text style={styles.tripDestName}>{trip.destination || 'Hành trình'}</Text>
                <Text style={styles.tripDates}>
                  Thời gian: {trip.startDate ? new Date(trip.startDate).toLocaleDateString('vi-VN') : ''} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString('vi-VN') : ''}
                </Text>
                <TouchableOpacity
                  style={styles.viewTripBtn}
                  onPress={() => navigation.navigate('TripDetail', { tripId: trip._id || trip })}
                >
                  <Text style={styles.viewTripBtnText}>Xem chi tiết lịch trình</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fullscreen Swipeable Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          {/* Viewer Header */}
          <View style={[styles.viewerHeader, { top: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.viewerHeaderBtn}>
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.viewerIndexText}>
              {viewerIndex + 1} / {images.length}
            </Text>
            <View style={styles.viewerHeaderRight}>
              <TouchableOpacity
                onPress={() => handleShareImage(images[viewerIndex])}
                style={styles.viewerHeaderBtn}
              >
                <Ionicons name="share-social-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleOpenBrowser(images[viewerIndex])}
                style={styles.viewerHeaderBtn}
              >
                <Ionicons name="open-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Full Screen Image Scroll */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: viewerIndex * SCREEN_WIDTH, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setViewerIndex(newIndex);
            }}
            style={styles.viewerScroll}
          >
            {images.map((img, idx) => (
              <View key={idx} style={styles.viewerImageWrapper}>
                <Image
                  source={{ uri: img }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* Viewer Footer */}
          <View style={[styles.viewerFooter, { bottom: insets.bottom + 16 }]}>
            <Text style={styles.viewerFooterText}>
              💡 Vuốt sang trái/phải để duyệt qua các bức ảnh kỷ niệm.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep slate dark mode for premium look
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: COLORS.gray[300],
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontStyle: 'italic',
  },
  headerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  coverContainer: {
    height: SCREEN_HEIGHT * 0.45,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  coverContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  dayBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emotionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  emotionBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 32,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray[300],
    fontWeight: '500',
  },
  blogContainer: {
    backgroundColor: '#0F172A',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  contentText: {
    fontSize: 16,
    color: COLORS.gray[200],
    lineHeight: 28,
    letterSpacing: 0.2,
    textAlign: 'justify',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    gap: 12,
  },
  galleryLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[700],
  },
  galleryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray[400],
    letterSpacing: 2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridImageItem: {
    width: (SCREEN_WIDTH - 32 - 8) / 2,
    height: 140,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[800],
  },
  gridImageItemFull: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[800],
  },
  gridImageItemWide: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[800],
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  tripCard: {
    marginTop: SPACING.xl,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  tripCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  tripCardContent: {
    padding: SPACING.md,
    gap: 6,
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[500],
  },
  tripDestName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
  },
  tripDates: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  viewTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  viewTripBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  viewerHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerHeaderRight: {
    flexDirection: 'row',
    gap: 8,
  },
  viewerIndexText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  viewerScroll: {
    flex: 1,
  },
  viewerImageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  viewerFooter: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  viewerFooterText: {
    color: COLORS.gray[400],
    fontSize: 12,
    textAlign: 'center',
  },
});

export default TripJournalDetailScreen;
