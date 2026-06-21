import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Loading from '../../components/common/Loading';
import useTrip from '../../hooks/useTrip';
import { ACTIVITY_CATEGORIES, COLORS, RADIUS, SPACING } from '../../utils/constants';
import { getNearbyPlaces } from '../../services/place/placeApi';
import { optimizeTripDay } from '../../services/trip/tripApi';

const PERIODS = [
  { key: 'morning', label: 'Sáng', title: 'Buổi Sáng', icon: 'sunny-outline', range: '05:00 - 11:59' },
  { key: 'noon', label: 'Trưa', title: 'Buổi Trưa', icon: 'restaurant-outline', range: '12:00 - 13:59' },
  { key: 'afternoon', label: 'Chiều', title: 'Buổi Chiều', icon: 'partly-sunny-outline', range: '14:00 - 17:59' },
  { key: 'evening', label: 'Tối', title: 'Buổi Tối', icon: 'moon-outline', range: '18:00 - 23:59' },
];

const DEFAULT_ACTIVITY = {
  location: '',
  time: '08:00',
  endTime: '',
  description: '',
  category: 'PLACE',
  cost: '',
  durationMinutes: '',
  transport: 'OTHER',
};

const CITY_CENTERS = {
  'da nang': { lat: 16.0544, lng: 108.2022 },
  'ha noi': { lat: 21.0285, lng: 105.8542 },
  'da lat': { lat: 11.9404, lng: 108.4583 },
  'phu quoc': { lat: 10.2290, lng: 103.9575 },
  'nha trang': { lat: 12.2458, lng: 109.1943 },
  'ho chi minh': { lat: 10.7769, lng: 106.7009 },
  'sai gon': { lat: 10.7769, lng: 106.7009 },
  'hoi an': { lat: 15.8801, lng: 108.3380 },
  'hue': { lat: 16.4637, lng: 107.5909 },
};

const getPlaceCategoryKey = (place) => {
  const cat = String(place.category || '').toLowerCase();
  if (cat.includes('ẩm thực') || cat.includes('nha hang') || cat.includes('quan an') || cat.includes('cafe')) return 'FOOD';
  if (cat.includes('khách sạn') || cat.includes('hotel') || cat.includes('resort')) return 'HOTEL';
  return 'PLACE';
};

const getActivityKey = (activity, index) => activity._id || activity.id || activity.clientKey || `local-${index}`;

const parseHour = (timeStr = '') => {
  const normalized = String(timeStr).trim().toUpperCase();
  const match = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
  if (!match) return 8;

  let hour = parseInt(match[1], 10);
  const ampm = match[3];
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return hour;
};

const getPeriodKey = (activity) => {
  const hour = parseHour(activity.time);
  if (hour < 12) return 'morning';
  if (hour < 14) return 'noon';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const getDefaultTime = (periodKey) => {
  if (periodKey === 'noon') return '12:00';
  if (periodKey === 'afternoon') return '14:00';
  if (periodKey === 'evening') return '18:00';
  return '08:00';
};

const buildTimeRange = (activity) => {
  if (activity.endTime) return `${activity.time || '08:00'} - ${activity.endTime}`;
  if (activity.durationMinutes) return `${activity.time || '08:00'} - ${activity.durationMinutes} phút`;
  return activity.time || '08:00';
};

const EditTripScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;
  const { currentTrip: trip, isLoading, fetchTripById, updateTrip } = useTrip();

  const [activities, setActivities] = useState([]);
  const [selectedDay, setSelectedDay] = useState(route.params?.day || 1);
  const [activePeriod, setActivePeriod] = useState('morning');
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState(DEFAULT_ACTIVITY);
  const [modalVisible, setModalVisible] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const fetchNearbySuggs = async () => {
    if (!trip) return;
    setLoadingNearby(true);
    try {
      const dayActs = activities.filter(
        (a) => (a.day || 1) === selectedDay && a.coordinates && a.coordinates.lat
      );
      
      let lat = null;
      let lng = null;
      
      if (dayActs.length > 0) {
        const lastAct = dayActs[dayActs.length - 1];
        lat = lastAct.coordinates.lat;
        lng = lastAct.coordinates.lng;
      } else {
        const tripActs = activities.filter((a) => a.coordinates && a.coordinates.lat);
        if (tripActs.length > 0) {
          lat = tripActs[0].coordinates.lat;
          lng = tripActs[0].coordinates.lng;
        } else {
          const dest = String(trip.destination || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
          for (const [city, coords] of Object.entries(CITY_CENTERS)) {
            if (dest.includes(city)) {
              lat = coords.lat;
              lng = coords.lng;
              break;
            }
          }
        }
      }

      if (!lat || !lng) {
        lat = 16.0544;
        lng = 108.2022;
      }

      const res = await getNearbyPlaces(lat, lng, '', 6, '', trip.destination);
      if (res.success && Array.isArray(res.data)) {
        setNearbyPlaces(res.data);
      }
    } catch (err) {
      console.error('Error fetching nearby places for edit screen:', err);
    } finally {
      setLoadingNearby(false);
    }
  };

  useEffect(() => {
    if (trip) {
      fetchNearbySuggs();
    }
  }, [trip, selectedDay, activities.length]);

  const swapActivities = (origIdxA, origIdxB) => {
    if (origIdxA === undefined || origIdxB === undefined) return;
    
    setActivities((prev) => {
      const next = [...prev];
      const tempTime = next[origIdxA].time;
      next[origIdxA].time = next[origIdxB].time;
      next[origIdxB].time = tempTime;
      return next;
    });
  };

  const onMoveUp = (index, periodActivities) => {
    if (index <= 0) return;
    const actA = periodActivities[index];
    const actB = periodActivities[index - 1];
    swapActivities(actA.originalIndex, actB.originalIndex);
  };

  const onMoveDown = (index, periodActivities) => {
    if (index >= periodActivities.length - 1) return;
    const actA = periodActivities[index];
    const actB = periodActivities[index + 1];
    swapActivities(actA.originalIndex, actB.originalIndex);
  };

  const handleOptimizeRoute = async () => {
    const dayActs = activities.filter(a => (a.day || 1) === selectedDay);
    const withCoords = dayActs.filter(a => a.coordinates && a.coordinates.lat && a.coordinates.lng);
    
    if (withCoords.length <= 2) {
      Alert.alert('Thông tin', 'Cần ít nhất 3 hoạt động có tọa độ địa lý trong ngày để tối ưu lộ trình.');
      return;
    }

    setOptimizing(true);
    try {
      const res = await optimizeTripDay(tripId, { activities: dayActs, day: selectedDay });
      if (res.success && res.data) {
        const optimizedActs = res.data.activities;
        const stats = res.data.stats;
        
        Alert.alert(
          '⚡ Tối ưu lộ trình thành công',
          `Lộ trình mới giúp bạn:\n• Tiết kiệm khoảng cách: ${stats.distanceSaved} km\n• Tiết kiệm thời gian di chuyển: ${stats.timeSavedMinutes} phút\n\nBạn có muốn áp dụng thay đổi này?`,
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Áp dụng',
              onPress: () => {
                setActivities(prev => {
                  const otherDays = prev.filter(a => (a.day || 1) !== selectedDay);
                  const mappedOptimized = optimizedActs.map((act, idx) => ({
                    ...act,
                    clientKey: act._id || act.clientKey || `opt-${Date.now()}-${idx}`,
                  }));
                  return [...otherDays, ...mappedOptimized];
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Thất bại', res.message || 'Không thể tối ưu lộ trình');
      }
    } catch (err) {
      console.error('Optimize error:', err);
      Alert.alert('Lỗi', 'Không thể kết nối tới dịch vụ tối ưu lộ trình.');
    } finally {
      setOptimizing(false);
    }
  };

  const addNearbyPlace = (place) => {
    const parsePrice = (priceVal) => {
      if (!priceVal) return 0;
      const clean = String(priceVal).toLowerCase();
      if (clean.includes('miễn phí') || clean.includes('free')) return 0;
      const match = clean.replace(/[.,\s]/g, '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    setEditingIndex(null);
    setDraft({
      ...DEFAULT_ACTIVITY,
      location: place.name,
      time: getDefaultTime(activePeriod),
      day: selectedDay,
      category: getPlaceCategoryKey(place),
      cost: place.ticketPrice ? String(parsePrice(place.ticketPrice)) : '0',
      coordinates: place.coordinates || null,
      address: place.address || '',
      description: place.introduction || '',
    });
    setModalVisible(true);
  };

  useEffect(() => {
    fetchTripById(tripId);
  }, [tripId]);

  useEffect(() => {
    if (trip) {
      setActivities(
        (trip.activities || []).map((activity, index) => ({
          ...activity,
          clientKey: getActivityKey(activity, index),
        }))
      );
    }
  }, [trip]);

  const totalDays = trip?.totalDays || 1;
  const groupedActivities = useMemo(() => {
    const initial = PERIODS.reduce((acc, period) => ({ ...acc, [period.key]: [] }), {});
    activities.forEach((activity, index) => {
      if ((activity.day || 1) !== selectedDay) return;
      const periodKey = getPeriodKey(activity);
      initial[periodKey].push({ ...activity, originalIndex: index });
    });

    Object.keys(initial).forEach((key) => {
      initial[key].sort((a, b) => parseHour(a.time) - parseHour(b.time));
    });

    return initial;
  }, [activities, selectedDay]);

  const currentPeriod = PERIODS.find((period) => period.key === activePeriod);
  const currentActivities = groupedActivities[activePeriod] || [];

  const openCreateModal = () => {
    setEditingIndex(null);
    setDraft({
      ...DEFAULT_ACTIVITY,
      time: getDefaultTime(activePeriod),
      day: selectedDay,
    });
    setModalVisible(true);
  };

  const openEditModal = (activity) => {
    setEditingIndex(activity.originalIndex);
    setDraft({
      ...DEFAULT_ACTIVITY,
      ...activity,
      cost: activity.cost ? String(activity.cost) : '',
      durationMinutes: activity.durationMinutes ? String(activity.durationMinutes) : '',
    });
    setModalVisible(true);
  };

  const deleteActivity = (activity) => {
    Alert.alert('Xóa hoạt động', `Bạn muốn xóa "${activity.location || 'hoạt động này'}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          setActivities((prev) => prev.filter((_, index) => index !== activity.originalIndex));
        },
      },
    ]);
  };

  const showActivityMenu = (activity) => {
    Alert.alert(activity.location || 'Hoạt động', 'Chọn thao tác', [
      { text: 'Sửa', onPress: () => openEditModal(activity) },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteActivity(activity) },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const saveDraft = () => {
    if (!draft.location.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên địa điểm hoặc hoạt động.');
      return;
    }

    const normalized = {
      ...draft,
      clientKey: draft.clientKey || `local-${Date.now()}`,
      location: draft.location.trim(),
      time: draft.time.trim() || getDefaultTime(activePeriod),
      endTime: draft.endTime?.trim() || '',
      description: draft.description?.trim() || '',
      category: draft.category || 'PLACE',
      cost: parseInt(draft.cost, 10) || 0,
      durationMinutes: parseInt(draft.durationMinutes, 10) || 0,
    };

    setActivities((prev) => {
      if (editingIndex === null) return [...prev, normalized];
      return prev.map((item, index) => (index === editingIndex ? normalized : item));
    });
    setModalVisible(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payloadActivities = activities.map(({ originalIndex, clientKey, ...activity }) => activity);
    const result = await updateTrip(tripId, { activities: payloadActivities });
    setSaving(false);

    if (result.success) {
      navigation.goBack();
    } else {
      Alert.alert('Lỗi', result.message || 'Không thể cập nhật lịch trình');
    }
  };

  if (isLoading || !trip) return <Loading message="Đang tải lịch trình..." />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa lịch trình</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? 'Đang lưu' : 'Lưu'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.periodTabs}>
        {PERIODS.map((period) => {
          const isActive = activePeriod === period.key;
          return (
            <TouchableOpacity
              key={period.key}
              style={styles.periodTab}
              onPress={() => setActivePeriod(period.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodTabText, isActive && styles.periodTabTextActive]}>
                {period.label}
              </Text>
              {isActive && <View style={styles.periodIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        {totalDays > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayTabs}
          >
            {Array.from({ length: totalDays }, (_, index) => index + 1).map((day) => {
              const isActive = selectedDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayTab, isActive && styles.dayTabActive]}
                  onPress={() => {
                    setSelectedDay(day);
                    setIsReordering(false);
                  }}
                >
                  <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>
                    Ngày {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, optimizing && styles.actionButtonDisabled]}
            onPress={handleOptimizeRoute}
            disabled={optimizing}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={14} color={COLORS.white} />
            <Text style={styles.actionButtonText}>
              {optimizing ? 'Đang tối ưu...' : 'Tối ưu lộ trình (AI)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButtonOutline, isReordering && styles.actionButtonActive]}
            onPress={() => setIsReordering(!isReordering)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isReordering ? 'checkmark-circle' : 'swap-vertical'}
              size={14}
              color={isReordering ? COLORS.white : COLORS.primary}
            />
            <Text style={[styles.actionButtonOutlineText, isReordering && styles.actionButtonActiveText]}>
              {isReordering ? 'Xong' : 'Sắp xếp lại'}
            </Text>
          </TouchableOpacity>
        </View>

        <PeriodSection
          period={currentPeriod}
          activities={currentActivities}
          isReordering={isReordering}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onAdd={openCreateModal}
          onEdit={openEditModal}
          onMenu={showActivityMenu}
        />

        {nearbyPlaces.length > 0 && !isReordering && (
          <View style={styles.nearbySection}>
            <View style={styles.nearbyHeader}>
              <Ionicons name="bulb-outline" size={16} color="#EAB308" />
              <Text style={styles.nearbyTitle}>💡 Địa điểm lân cận gợi ý</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nearbyScroll}
            >
              {nearbyPlaces.map((place) => {
                const placeCat = ACTIVITY_CATEGORIES[getPlaceCategoryKey(place)] || ACTIVITY_CATEGORIES.PLACE;
                return (
                  <TouchableOpacity
                    key={place._id}
                    style={styles.nearbyCard}
                    onPress={() => addNearbyPlace(place)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.nearbyIconContainer, { backgroundColor: `${placeCat.color}15` }]}>
                      <Ionicons name={placeCat.icon} size={16} color={placeCat.color} />
                    </View>
                    <View style={styles.nearbyInfo}>
                      <Text style={styles.nearbyCardTitle} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={styles.nearbyCardMeta} numberOfLines={1}>
                        ⭐ {place.rating || '4.5'} • {place.distance} km
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {PERIODS.filter((period) => period.key !== activePeriod).map((period) => (
          <CollapsedPeriod
            key={period.key}
            period={period}
            count={groupedActivities[period.key]?.length || 0}
            onPress={() => setActivePeriod(period.key)}
          />
        ))}
      </ScrollView>

      <ActivityModal
        visible={modalVisible}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setModalVisible(false)}
        onSave={saveDraft}
      />
    </KeyboardAvoidingView>
  );
};

const PeriodSection = ({ period, activities, isReordering, onMoveUp, onMoveDown, onAdd, onEdit, onMenu }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <Ionicons name={period.icon} size={18} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>{period.title}</Text>
      </View>
      <View style={styles.countPill}>
        <Text style={styles.countText}>{activities.length} Hoạt động</Text>
      </View>
    </View>

    {activities.map((activity, index) => (
      <ActivityEditCard
        key={activity.clientKey || activity.originalIndex}
        activity={activity}
        isReordering={isReordering}
        onMoveUp={() => onMoveUp(index, activities)}
        onMoveDown={() => onMoveDown(index, activities)}
        onPress={() => onEdit(activity)}
        onMenu={() => onMenu(activity)}
      />
    ))}

    {!isReordering && (
      <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={18} color={COLORS.info} />
        <Text style={styles.addText}>Thêm hoạt động mới</Text>
      </TouchableOpacity>
    )}
  </View>
);

const CollapsedPeriod = ({ period, count, onPress }) => (
  <TouchableOpacity style={styles.collapsedSection} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.sectionTitleWrap}>
      <Ionicons name={period.icon} size={17} color={COLORS.gray[400]} />
      <Text style={styles.collapsedTitle}>{period.title}</Text>
    </View>
    {count > 0 && (
      <View style={styles.countPillMuted}>
        <Text style={styles.countTextMuted}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const ActivityEditCard = ({ activity, isReordering, onMoveUp, onMoveDown, onPress, onMenu }) => {
  const category = ACTIVITY_CATEGORIES[activity.category] || ACTIVITY_CATEGORIES.PLACE;

  return (
    <TouchableOpacity style={styles.activityCard} onPress={onPress} activeOpacity={0.85}>
      {isReordering ? (
        <View style={styles.reorderControls}>
          <TouchableOpacity style={styles.reorderArrow} onPress={onMoveUp} hitSlop={6}>
            <Ionicons name="chevron-up" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.reorderArrow} onPress={onMoveDown} hitSlop={6}>
            <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.dragHandle}>
          <Ionicons name="grid-outline" size={15} color={COLORS.gray[300]} />
        </View>
      )}
      <View style={[styles.thumbnail, { backgroundColor: `${category.color}18` }]}>
        <Ionicons name={category.icon} size={24} color={category.color} />
      </View>
      <View style={styles.activityInfo}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {activity.location || 'Hoạt động mới'}
        </Text>
        <View style={styles.activityMeta}>
          <Ionicons name="time-outline" size={12} color={COLORS.gray[500]} />
          <Text style={styles.activityTime}>{buildTimeRange(activity)}</Text>
        </View>
      </View>
      {!isReordering && (
        <TouchableOpacity style={styles.moreButton} onPress={onMenu} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={18} color={COLORS.info} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const ActivityModal = ({ visible, draft, setDraft, onClose, onSave }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalKeyboard}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thông tin hoạt động</Text>
            <TouchableOpacity style={styles.iconButtonSmall} onPress={onClose}>
              <Ionicons name="close" size={20} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <FormInput
              label="Tên địa điểm"
              value={draft.location}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, location: value }))}
              placeholder="Ví dụ: Ngũ Hành Sơn"
            />
            <View style={styles.inputRow}>
              <FormInput
                label="Bắt đầu"
                value={draft.time}
                onChangeText={(value) => setDraft((prev) => ({ ...prev, time: value }))}
                placeholder="08:00"
                style={styles.inputHalf}
              />
              <FormInput
                label="Kết thúc"
                value={draft.endTime}
                onChangeText={(value) => setDraft((prev) => ({ ...prev, endTime: value }))}
                placeholder="10:00"
                style={styles.inputHalf}
              />
            </View>
            <View style={styles.inputRow}>
              <FormInput
                label="Chi phí"
                value={draft.cost}
                onChangeText={(value) => setDraft((prev) => ({ ...prev, cost: value }))}
                placeholder="0"
                keyboardType="numeric"
                style={styles.inputHalf}
              />
              <FormInput
                label="Thời lượng"
                value={draft.durationMinutes}
                onChangeText={(value) => setDraft((prev) => ({ ...prev, durationMinutes: value }))}
                placeholder="120"
                keyboardType="numeric"
                style={styles.inputHalf}
              />
            </View>
            <Text style={styles.formLabel}>Loại hoạt động</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {Object.entries(ACTIVITY_CATEGORIES).map(([key, category]) => {
                const selected = draft.category === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryChip,
                      selected && { borderColor: category.color, backgroundColor: `${category.color}12` },
                    ]}
                    onPress={() => setDraft((prev) => ({ ...prev, category: key }))}
                  >
                    <Ionicons name={category.icon} size={14} color={selected ? category.color : COLORS.gray[500]} />
                    <Text style={[styles.categoryText, selected && { color: category.color }]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <FormInput
              label="Ghi chú"
              value={draft.description}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, description: value }))}
              placeholder="Mô tả ngắn cho hoạt động"
              multiline
              inputStyle={styles.noteInput}
            />
          </ScrollView>

          <TouchableOpacity style={styles.modalSaveButton} onPress={onSave}>
            <Text style={styles.modalSaveText}>Lưu hoạt động</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  </Modal>
);

const FormInput = ({ label, style, inputStyle, ...props }) => (
  <View style={[styles.formGroup, style]}>
    <Text style={styles.formLabel}>{label}</Text>
    <TextInput
      {...props}
      placeholderTextColor={COLORS.gray[400]}
      style={[styles.formInput, inputStyle]}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray[700],
  },
  saveButton: {
    minWidth: 58,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF9A7A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  periodTabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  periodTab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: 10,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray[400],
  },
  periodTabTextActive: { color: COLORS.primary },
  periodIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.primary,
  },
  content: { flex: 1, backgroundColor: COLORS.white },
  contentInner: { padding: SPACING.md },
  dayTabs: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  dayTab: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  dayTabActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF7ED',
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray[500],
  },
  dayTabTextActive: { color: COLORS.primary },
  section: { marginBottom: SPACING.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gray[800],
  },
  countPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[500],
  },
  activityCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  dragHandle: {
    width: 24,
    alignItems: 'center',
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  activityInfo: { flex: 1, minWidth: 0 },
  activityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 7,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  moreButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.info,
  },
  collapsedSection: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  collapsedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gray[400],
  },
  countPillMuted: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  countTextMuted: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gray[500],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: { justifyContent: 'flex-end', flex: 1 },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
  },
  iconButtonSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: { marginBottom: SPACING.md },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray[600],
    marginBottom: 6,
  },
  formInput: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    color: COLORS.black,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputHalf: { flex: 1 },
  noteInput: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  categoryList: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  categoryChip: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray[500],
  },
  modalSaveButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    marginTop: 4,
  },
  actionButton: {
    flex: 1.2,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  actionButtonOutline: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonOutlineText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  actionButtonActiveText: {
    color: COLORS.white,
  },
  reorderControls: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginRight: 4,
  },
  reorderArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbySection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: '#FAFAFA',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  nearbyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.gray[700],
  },
  nearbyScroll: {
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  nearbyCard: {
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nearbyIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
  },
  nearbyCardMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginTop: 2,
  },
});

export default EditTripScreen;
