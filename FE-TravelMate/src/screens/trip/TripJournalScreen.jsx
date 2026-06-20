import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import useAuthStore from '../../store/auth/authStore';
import useTrip from '../../hooks/useTrip';
import { upgradeToPremium } from '../../services/auth/authApi';
import * as journalApi from '../../services/journal/journalApi';
import { COLORS, SPACING, RADIUS, FONTS } from '../../utils/constants';
import { formatDateRange, getDayCount } from '../../utils/dateUtils';
import Header from '../../components/common/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EMOTIONS = [
  { char: '😊', label: 'Vui vẻ' },
  { char: '😍', label: 'Hạnh phúc' },
  { char: '🤩', label: 'Tuyệt vời' },
  { char: '😌', label: 'Thư giãn' },
  { char: '😢', label: 'Buồn' },
  { char: '😴', label: 'Mệt nhưng đáng nhớ' },
];

const EMOTION_MAP = EMOTIONS.reduce((acc, curr) => {
  acc[curr.char] = curr.label;
  return acc;
}, {});

const TripJournalScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const { currentTrip: trip, fetchTripById, isLoading: isLoadingTrip } = useTrip();

  const [journals, setJournals] = useState([]);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' or 'gallery'

  // Modal & Form states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formEmotion, setFormEmotion] = useState('😊');
  const [formSelectedDate, setFormSelectedDate] = useState('');
  
  // Image Upload states
  const [formKeepImageUrls, setFormKeepImageUrls] = useState([]); // existing urls to keep (when editing)
  const [formLocalPhotos, setFormLocalPhotos] = useState([]); // new local photo objects { uri, name, type }
  const [saving, setSaving] = useState(false);

  // Gallery Viewer states
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const isPremium = user && user.package === 'premium';

  useEffect(() => {
    fetchTripById(tripId);
  }, [tripId]);

  useEffect(() => {
    if (isPremium && trip) {
      loadJournals();
      if (trip.startDate) {
        setFormSelectedDate(new Date(trip.startDate).toISOString());
      }
    }
  }, [isPremium, trip?._id]);

  const loadJournals = async () => {
    try {
      setLoadingJournals(true);
      const res = await journalApi.getJournalsByTrip(tripId);
      if (res.success) {
        setJournals(res.data);
      }
    } catch (err) {
      console.error('Error loading journals:', err);
    } finally {
      setLoadingJournals(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const res = await upgradeToPremium();
      if (res.success) {
        await refreshProfile();
        Alert.alert('Thành công 🎉', 'Chúc mừng! Tài khoản của bạn đã được nâng cấp lên gói Premium. Chào mừng bạn đến với Premium Travel Journal!');
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể nâng cấp tài khoản lúc này.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Có lỗi xảy ra khi nâng cấp tài khoản.');
    } finally {
      setUpgrading(false);
    }
  };

  const handlePickImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập bị từ chối', 'Bạn cần cho phép truy cập thư viện ảnh để tải hình lên.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const selectedAssets = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.fileName || `journal_img_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }));
      setFormLocalPhotos(prev => [...prev, ...selectedAssets]);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập bị từ chối', 'Bạn cần cho phép truy cập camera để chụp ảnh.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const newPhoto = {
        uri: asset.uri,
        name: asset.fileName || `journal_cam_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };
      setFormLocalPhotos(prev => [...prev, newPhoto]);
    }
  };

  const handleOpenAddModal = () => {
    setEditingJournal(null);
    setFormTitle('');
    setFormContent('');
    setFormEmotion('😊');
    setFormKeepImageUrls([]);
    setFormLocalPhotos([]);
    if (trip && trip.startDate) {
      setFormSelectedDate(new Date(trip.startDate).toISOString());
    } else {
      setFormSelectedDate(new Date().toISOString());
    }
    setModalVisible(true);
  };

  const handleOpenEditModal = (journal, event) => {
    event.stopPropagation(); // prevent card press navigation
    setEditingJournal(journal);
    setFormTitle(journal.title);
    setFormContent(journal.content);
    setFormEmotion(journal.emotion || '😊');
    setFormKeepImageUrls(journal.imageUrls || []);
    setFormLocalPhotos([]);
    setFormSelectedDate(journal.journalDate || journal.date || new Date().toISOString());
    setModalVisible(true);
  };

  const handleSaveJournal = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề nhật ký.');
      return;
    }
    if (!formContent.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập nội dung nhật ký.');
      return;
    }

    try {
      setSaving(true);
      
      const formData = new FormData();
      formData.append('title', formTitle.trim());
      formData.append('content', formContent.trim());
      formData.append('emotion', formEmotion);
      formData.append('journalDate', formSelectedDate);

      if (editingJournal) {
        formData.append('keepImages', JSON.stringify(formKeepImageUrls));
      }

      formLocalPhotos.forEach((photo) => {
        formData.append('images[]', {
          uri: Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
          name: photo.name,
          type: photo.type,
        });
      });

      let res;
      if (editingJournal) {
        res = await journalApi.updateJournal(editingJournal._id, formData);
      } else {
        res = await journalApi.createJournal(tripId, formData);
      }

      if (res.success) {
        setModalVisible(false);
        loadJournals();
        Alert.alert('Thành công 🎉', editingJournal ? 'Đã lưu các thay đổi của kỷ niệm này!' : 'Đã tạo nhật ký hành trình mới!');
      } else {
        Alert.alert('Thất bại', res.message || 'Lưu nhật ký không thành công.');
      }
    } catch (err) {
      console.error('Error saving journal:', err);
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu nhật ký.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJournal = (id, event) => {
    event.stopPropagation(); // prevent card press navigation
    Alert.alert('Xóa nhật ký', 'Bạn có chắc muốn xóa kỷ niệm này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await journalApi.deleteJournal(id);
            if (res.success) {
              loadJournals();
              Alert.alert('Thành công', 'Đã xóa nhật ký và hình ảnh liên quan thành công.');
            } else {
              Alert.alert('Thất bại', res.message || 'Không thể xóa nhật ký.');
            }
          } catch (err) {
            Alert.alert('Lỗi', err.message || 'Có lỗi xảy ra khi xóa nhật ký.');
          }
        },
      },
    ]);
  };

  const handleOpenBrowser = async (url) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareImage = async (url) => {
    try {
      await Share.share({
        message: `Bức ảnh tuyệt vời từ chuyến đi: ${url}`,
        url: url,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getTripDays = () => {
    if (!trip || !trip.startDate || !trip.endDate) return [];
    const dayCount = getDayCount(trip.startDate, trip.endDate) || 1;
    const days = [];
    const start = new Date(trip.startDate);
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        label: `Ngày ${i + 1}`,
        sub: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        value: d.toISOString(),
      });
    }
    return days;
  };

  const tripDays = getTripDays();

  // Aggregate all images for Memory Gallery
  const allImages = journals.reduce((acc, curr) => {
    if (curr.imageUrls && curr.imageUrls.length > 0) {
      acc.push(...curr.imageUrls);
    }
    return acc;
  }, []);

  // Stats
  const totalJournals = journals.length;
  const totalImages = allImages.length;

  // Render Lock screen for Free users
  if (!isPremium) {
    return (
      <View style={styles.container}>
        <Header title="Nhật ký hành trình" onBack={() => navigation.goBack()} />
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#C084FC']}
          style={styles.lockContainer}
        >
          <View style={styles.lockCard}>
            <View style={styles.crownGlow}>
              <Ionicons name="diamond" size={56} color="#FBBF24" />
            </View>
            
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>TRAVELMATE PREMIUM</Text>
            </View>

            <Text style={styles.lockTitle}>Premium Travel Journal</Text>
            <Text style={styles.lockSubtitle}>
              Giao diện Travel Journal là tính năng dành riêng cho gói Premium của hệ thống TravelMate.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="sparkles-outline" size={20} color="#7C3AED" />
                <Text style={styles.featureItemText}>Lưu giữ kỷ niệm chuyến đi</Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="images-outline" size={20} color="#7C3AED" />
                <Text style={styles.featureItemText}>Upload nhiều hình ảnh trực tiếp</Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="heart-outline" size={20} color="#7C3AED" />
                <Text style={styles.featureItemText}>Ghi lại cảm xúc và trải nghiệm</Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="git-commit-outline" size={20} color="#7C3AED" />
                <Text style={styles.featureItemText}>Xem lại hành trình theo Timeline</Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="lock-closed-outline" size={20} color="#7C3AED" />
                <Text style={styles.featureItemText}>Bộ sưu tập ảnh du lịch riêng tư</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.upgradeButton} 
              onPress={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.upgradeButtonText}>Nâng cấp Premium</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backLockBtn} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backLockBtnText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Travel Journal"
        subtitle={trip ? `${trip.destination}` : 'Đang tải...'}
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleOpenAddModal} style={styles.addHeaderBtn}>
            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {isLoadingTrip || loadingJournals ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang lấy sách kỷ niệm...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Stats Bar */}
          {trip && (
            <View style={styles.statsBar}>
              <View style={styles.statsCol}>
                <Text style={styles.statsVal}>{totalJournals}</Text>
                <Text style={styles.statsLbl}>Kỷ niệm</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsCol}>
                <Text style={styles.statsVal}>{totalImages}</Text>
                <Text style={styles.statsLbl}>Hình ảnh</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsCol}>
                <Text style={styles.statsVal}>
                  {getDayCount(trip.startDate, trip.endDate) || 1}
                </Text>
                <Text style={styles.statsLbl}>Ngày đi</Text>
              </View>
            </View>
          )}

          {/* Tab Selection */}
          <View style={styles.tabSelector}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'timeline' && styles.tabBtnActive]}
              onPress={() => setActiveTab('timeline')}
            >
              <Ionicons name="git-branch-outline" size={18} color={activeTab === 'timeline' ? COLORS.primary : COLORS.gray[500]} />
              <Text style={[styles.tabBtnText, activeTab === 'timeline' && styles.tabBtnTextActive]}>
                Dòng thời gian
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'gallery' && styles.tabBtnActive]}
              onPress={() => setActiveTab('gallery')}
            >
              <Ionicons name="images-outline" size={18} color={activeTab === 'gallery' ? COLORS.primary : COLORS.gray[500]} />
              <Text style={[styles.tabBtnText, activeTab === 'gallery' && styles.tabBtnTextActive]}>
                Bộ sưu tập ảnh
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'timeline' ? (
              // TIMELINE VIEW
              journals.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="book-outline" size={48} color={COLORS.gray[300]} />
                  </View>
                  <Text style={styles.emptyTitle}>Chưa có bài viết nhật ký</Text>
                  <Text style={styles.emptySubtitle}>
                    Bấm vào nút dưới đây để tạo kỷ niệm đầu tiên cho hành trình này.
                  </Text>
                  <TouchableOpacity style={styles.createFirstBtn} onPress={handleOpenAddModal}>
                    <Text style={styles.createFirstBtnText}>Tạo nhật ký mới</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.timeline}>
                  {journals.map((item, idx) => {
                    const journalDate = new Date(item.journalDate || item.date);
                    const images = item.imageUrls || [];
                    const cardCover = images.length > 0 ? images[0] : null;
                    const dayIndex = trip && trip.startDate 
                      ? Math.floor((journalDate - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)) + 1 
                      : null;

                    return (
                      <TouchableOpacity 
                        key={item._id} 
                        style={styles.timelineItem}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('TripJournalDetail', { journalId: item._id })}
                      >
                        {/* Timeline graphic */}
                        <View style={styles.timelineLeft}>
                          <View style={styles.timelineDot}>
                            <Text style={{ fontSize: 13 }}>{item.emotion || '😊'}</Text>
                          </View>
                          {idx !== journals.length - 1 && <View style={styles.timelineLine} />}
                        </View>

                        {/* Card */}
                        <View style={styles.journalCard}>
                          {!!cardCover && (
                            <Image source={{ uri: cardCover }} style={styles.journalCardImage} />
                          )}
                          <View style={styles.journalCardBody}>
                            <View style={styles.journalCardHeader}>
                              <Text style={styles.journalDay}>
                                {dayIndex ? `Ngày ${dayIndex}` : 'Nhật ký'} • {journalDate.toLocaleDateString('vi-VN')}
                              </Text>
                              <View style={styles.cardActions}>
                                <TouchableOpacity 
                                  style={styles.cardActionBtn} 
                                  onPress={(e) => handleOpenEditModal(item, e)}
                                >
                                  <Ionicons name="pencil-outline" size={15} color={COLORS.gray[500]} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  style={styles.cardActionBtn} 
                                  onPress={(e) => handleDeleteJournal(item._id, e)}
                                >
                                  <Ionicons name="trash-outline" size={15} color={COLORS.error} />
                                </TouchableOpacity>
                              </View>
                            </View>

                            <Text style={styles.journalTitle}>{item.title}</Text>
                            <Text style={styles.journalContent} numberOfLines={3}>
                              {item.content}
                            </Text>
                            {images.length > 1 && (
                              <View style={styles.imageCountBadge}>
                                <Ionicons name="image-outline" size={11} color={COLORS.white} />
                                <Text style={styles.imageCountText}>+{images.length - 1} ảnh</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            ) : (
              // GALLERY VIEW (Memory Gallery)
              allImages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="images-outline" size={48} color={COLORS.gray[300]} />
                  </View>
                  <Text style={styles.emptyTitle}>Chưa có hình ảnh</Text>
                  <Text style={styles.emptySubtitle}>
                    Hãy viết nhật ký hành trình và upload các hình ảnh chụp để tạo nên bộ sưu tập tại đây.
                  </Text>
                </View>
              ) : (
                <View style={styles.galleryGrid}>
                  {allImages.map((img, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.galleryGridItem}
                      activeOpacity={0.9}
                      onPress={() => {
                        setViewerImages(allImages);
                        setViewerIndex(index);
                        setViewerVisible(true);
                      }}
                    >
                      <Image source={{ uri: img }} style={styles.galleryGridImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              )
            )}
          </ScrollView>
        </View>
      )}

      {/* Floating Action Button */}
      {isPremium && (
        <TouchableOpacity style={styles.fab} onPress={handleOpenAddModal}>
          <Ionicons name="pencil" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingJournal ? 'Chỉnh sửa nhật ký' : 'Tạo nhật ký hành trình'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Day selection */}
              {tripDays.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Chọn ngày của chuyến đi</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChips}>
                    {tripDays.map((d) => {
                      const isSelected = new Date(formSelectedDate).toDateString() === new Date(d.value).toDateString();
                      return (
                        <TouchableOpacity
                          key={d.value}
                          style={[styles.dayChip, isSelected && styles.dayChipActive]}
                          onPress={() => setFormSelectedDate(d.value)}
                        >
                          <Text style={[styles.dayChipLabel, isSelected && styles.dayChipLabelActive]}>{d.label}</Text>
                          <Text style={[styles.dayChipSub, isSelected && styles.dayChipSubActive]}>{d.sub}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Title input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tiêu đề kỷ niệm</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ngày đầu tiên tuyệt vời..."
                  placeholderTextColor={COLORS.gray[400]}
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              {/* Emotion selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cảm xúc ngày hôm nay</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emotionRow}>
                  {EMOTIONS.map((emo) => {
                    const isSelected = formEmotion === emo.char;
                    return (
                      <TouchableOpacity
                        key={emo.char}
                        style={[styles.emotionChip, isSelected && styles.emotionChipActive]}
                        onPress={() => setFormEmotion(emo.char)}
                      >
                        <Text style={{ fontSize: 20 }}>{emo.char}</Text>
                        <Text style={[styles.emotionChipLabel, isSelected && styles.emotionChipLabelActive]}>
                          {emo.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Photo Upload Section */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Hình ảnh lưu giữ ({formKeepImageUrls.length + formLocalPhotos.length} ảnh)</Text>
                
                {/* Photo pick controls */}
                <View style={styles.uploadControls}>
                  <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImages}>
                    <Ionicons name="images-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.uploadBtnText}>Thư viện ảnh</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadBtn} onPress={handleTakePhoto}>
                    <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.uploadBtnText}>Chụp ảnh</Text>
                  </TouchableOpacity>
                </View>

                {/* Horizontal list of photos to display / delete */}
                {(formKeepImageUrls.length > 0 || formLocalPhotos.length > 0) && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.uploadedThumbsRow}>
                    {/* Render existing images */}
                    {formKeepImageUrls.map((url, idx) => (
                      <View key={`exist_${idx}`} style={styles.thumbWrapper}>
                        <Image source={{ uri: url }} style={styles.thumbImage} />
                        <TouchableOpacity
                          style={styles.deleteThumbBtn}
                          onPress={() => setFormKeepImageUrls(prev => prev.filter(u => u !== url))}
                        >
                          <Ionicons name="close-circle" size={18} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Render newly picked local photos */}
                    {formLocalPhotos.map((photo, idx) => (
                      <View key={`local_${idx}`} style={styles.thumbWrapper}>
                        <Image source={{ uri: photo.uri }} style={styles.thumbImage} />
                        <TouchableOpacity
                          style={styles.deleteThumbBtn}
                          onPress={() => setFormLocalPhotos(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Ionicons name="close-circle" size={18} color={COLORS.error} />
                        </TouchableOpacity>
                        <View style={styles.localTag}>
                          <Text style={styles.localTagText}>Mới</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Content input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Trải nghiệm, kỷ niệm của bạn</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Ghi lại các kỷ niệm đáng nhớ..."
                  placeholderTextColor={COLORS.gray[400]}
                  value={formContent}
                  onChangeText={setFormContent}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSaveJournal}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu kỷ niệm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullscreen Photo Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerContainer}>
          <View style={[styles.viewerHeader, { top: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.viewerHeaderBtn}>
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.viewerIndexText}>
              {viewerIndex + 1} / {viewerImages.length}
            </Text>
            <View style={styles.viewerHeaderRight}>
              <TouchableOpacity
                onPress={() => handleShareImage(viewerImages[viewerIndex])}
                style={styles.viewerHeaderBtn}
              >
                <Ionicons name="share-social-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleOpenBrowser(viewerImages[viewerIndex])}
                style={styles.viewerHeaderBtn}
              >
                <Ionicons name="open-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

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
            {viewerImages.map((img, idx) => (
              <View key={idx} style={styles.viewerImageWrapper}>
                <Image
                  source={{ uri: img }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.viewerFooter}>
            <Text style={styles.viewerFooterText}>
              💡 Thư viện hình ảnh kỷ niệm của riêng bạn
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
    backgroundColor: COLORS.background,
  },
  addHeaderBtn: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: SPACING.md,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  lockCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  crownGlow: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  premiumBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 1,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  lockSubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
    paddingHorizontal: 8,
  },
  featuresList: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  featureItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    width: '100%',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  backLockBtn: {
    marginTop: 12,
    padding: 8,
  },
  backLockBtnText: {
    fontSize: 13,
    color: COLORS.gray[500],
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
  },
  statsVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
  },
  statsLbl: {
    fontSize: 10,
    color: COLORS.gray[400],
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.gray[200],
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gray[50],
  },
  tabBtnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  tabBtnTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    marginTop: SPACING.md,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.gray[400],
    textAlign: 'center',
    lineHeight: 18,
  },
  createFirstBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  createFirstBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 10,
  },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.gray[200],
    marginTop: 4,
  },
  journalCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  journalCardImage: {
    height: 130,
    width: '100%',
  },
  journalCardBody: {
    padding: SPACING.md,
    position: 'relative',
  },
  journalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  journalDay: {
    fontSize: 11,
    color: COLORS.gray[400],
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardActionBtn: {
    padding: 2,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  journalContent: {
    fontSize: 13,
    color: COLORS.gray[600],
    lineHeight: 18,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  imageCountText: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: '700',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryGridItem: {
    width: (SCREEN_WIDTH - 32 - 16) / 3,
    height: (SCREEN_WIDTH - 32 - 16) / 3,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[200],
  },
  galleryGridImage: {
    width: '100%',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  modalForm: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray[700],
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.sm,
    padding: 12,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.gray[50],
  },
  textArea: {
    height: 110,
  },
  dayChips: {
    gap: 8,
    paddingVertical: 4,
  },
  dayChip: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  dayChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  dayChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  dayChipLabelActive: {
    color: COLORS.primaryDark,
  },
  dayChipSub: {
    fontSize: 9,
    color: COLORS.gray[400],
    marginTop: 1,
  },
  dayChipSubActive: {
    color: COLORS.primaryDark,
  },
  emotionRow: {
    gap: 8,
    paddingVertical: 4,
  },
  emotionChip: {
    alignItems: 'center',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    backgroundColor: COLORS.gray[50],
    width: 90,
    marginHorizontal: 2,
  },
  emotionChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  emotionChipLabel: {
    fontSize: 9,
    color: COLORS.gray[500],
    marginTop: 4,
    textAlign: 'center',
  },
  emotionChipLabelActive: {
    color: '#D97706',
    fontWeight: '700',
  },
  uploadControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    backgroundColor: COLORS.gray[50],
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  uploadedThumbsRow: {
    gap: 8,
    paddingVertical: 6,
  },
  thumbWrapper: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.sm,
    position: 'relative',
    marginRight: 6,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.sm,
  },
  deleteThumbBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.white,
    borderRadius: 9,
  },
  localTag: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: COLORS.success,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  localTagText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    padding: SPACING.md,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.gray[600],
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
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
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  viewerFooter: {
    position: 'absolute',
    bottom: 24,
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

export default TripJournalScreen;
