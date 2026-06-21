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
import { getNearbyPlaces, searchPlaces } from '../../services/place/placeApi';
import { optimizeTripDay } from '../../services/trip/tripApi';
import { getNavigationEstimate } from '../../services/navigation/navigationApi';

const PERIODS = [
  { key: 'morning', label: 'Sáng', title: 'Buổi Sáng', icon: 'sunny-outline', range: '05:00 - 11:59' },
  { key: 'noon', label: 'Trưa', title: 'Buổi Trưa', icon: 'restaurant-outline', range: '12:00 - 13:59' },
  { key: 'afternoon', label: 'Chiều', title: 'Buổi Chiều', icon: 'partly-sunny-outline', range: '14:00 - 17:59' },
  { key: 'evening', label: 'Tối', title: 'Buổi Tối', icon: 'moon-outline', range: '18:00 - 23:59' },
];

const TRANSPORT_MODES = {
  WALKING: { label: 'Đi bộ', icon: 'walk-outline', color: '#10B981' },
  BIKE: { label: 'Xe đạp', icon: 'bicycle-outline', color: '#3B82F6' },
  MOTORBIKE: { label: 'Xe máy', icon: 'bicycle-outline', color: '#F59E0B' },
  CAR: { label: 'Ô tô', icon: 'car-outline', color: '#EF4444' },
  BUS: { label: 'Xe buýt', icon: 'bus-outline', color: '#8B5CF6' },
  TAXI: { label: 'Taxi', icon: 'car-sport-outline', color: '#EC4899' },
  GRAB: { label: 'Grab', icon: 'car-outline', color: '#10B981' },
  OTHER: { label: 'Khác', icon: 'navigate-outline', color: '#6B7280' },
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
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

  const [transportModalVisible, setTransportModalVisible] = useState(false);
  const [activeTransitionFrom, setActiveTransitionFrom] = useState(null);
  const [activeTransitionTo, setActiveTransitionTo] = useState(null);

  const onEditTransport = (fromAct, toAct) => {
    setActiveTransitionFrom(fromAct);
    setActiveTransitionTo(toAct);
    setTransportModalVisible(true);
  };

  const saveTransport = ({ transport, travelTimeMinutes, travelDistanceKm }) => {
    if (activeTransitionTo) {
      setActivities((prev) =>
        prev.map((item, index) =>
          index === activeTransitionTo.originalIndex
            ? { ...item, transport, travelTimeMinutes, travelDistanceKm }
            : item
        )
      );
    }
    setTransportModalVisible(false);
  };

  const dayTotals = useMemo(() => {
    const dayActs = activities.filter((a) => (a.day || 1) === selectedDay);
    let duration = 0;
    let travel = 0;
    dayActs.forEach((act) => {
      duration += Number(act.durationMinutes || 0);
      travel += Number(act.travelTimeMinutes || 0);
    });
    return {
      totalMinutes: duration + travel,
      activityMinutes: duration,
      travelMinutes: travel,
    };
  }, [activities, selectedDay]);

  const formatDuration = (totalMinutes) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0) {
      return `${hrs} giờ${mins > 0 ? ` ${mins} phút` : ''}`;
    }
    return `${mins} phút`;
  };


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

  const getPredecessor = (activity) => {
    const dayActs = activities
      .map((act, index) => ({ ...act, originalIndex: index }))
      .filter((act) => (act.day || 1) === selectedDay)
      .sort((a, b) => parseHour(a.time) - parseHour(b.time));
    
    const idx = dayActs.findIndex((a) => a.originalIndex === activity.originalIndex);
    if (idx > 0) {
      return dayActs[idx - 1];
    }
    return null;
  };

  const getSuccessor = (activity) => {
    const dayActs = activities
      .map((act, index) => ({ ...act, originalIndex: index }))
      .filter((act) => (act.day || 1) === selectedDay)
      .sort((a, b) => parseHour(a.time) - parseHour(b.time));
    
    const idx = dayActs.findIndex((a) => a.originalIndex === activity.originalIndex);
    if (idx >= 0 && idx < dayActs.length - 1) {
      return dayActs[idx + 1];
    }
    return null;
  };

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

        <View style={styles.daySummaryBox}>
          <Ionicons name="time-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.daySummaryText}>
            Ngày {selectedDay}: Tổng thời gian {formatDuration(dayTotals.totalMinutes)}
            {dayTotals.travelMinutes > 0 && ` (trong đó di chuyển: ${formatDuration(dayTotals.travelMinutes)})`}
          </Text>
        </View>

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
          onEditTransport={onEditTransport}
          getSuccessor={getSuccessor}
          getPredecessor={getPredecessor}
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

      <TransportModal
        visible={transportModalVisible}
        fromActivity={activeTransitionFrom}
        toActivity={activeTransitionTo}
        onClose={() => setTransportModalVisible(false)}
        onSave={saveTransport}
      />
    </KeyboardAvoidingView>
  );
};


const PeriodSection = ({ period, activities, isReordering, onMoveUp, onMoveDown, onAdd, onEdit, onMenu, onEditTransport, getSuccessor, getPredecessor }) => (
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

    {activities.map((activity, index) => {
      const items = [];
      
      // If it is the first activity of the period, check if it has a predecessor in a previous period
      if (index === 0 && !isReordering) {
        const predecessor = getPredecessor(activity);
        if (predecessor) {
          items.push(
            <TransitionCard
              key={`trans-prev-${activity.clientKey || activity.originalIndex}`}
              fromActivity={predecessor}
              toActivity={activity}
              onEdit={() => onEditTransport(predecessor, activity)}
            />
          );
        }
      }

      items.push(
        <ActivityEditCard
          key={activity.clientKey || activity.originalIndex}
          activity={activity}
          isReordering={isReordering}
          onMoveUp={() => onMoveUp(index, activities)}
          onMoveDown={() => onMoveDown(index, activities)}
          onPress={() => onEdit(activity)}
          onMenu={() => onMenu(activity)}
        />
      );

      // Render transition after the activity:
      // Case 1: Has a successor in the same period
      // Case 2: Is the last activity of this period, and has a successor in a future period
      if (!isReordering) {
        if (index < activities.length - 1) {
          const nextAct = activities[index + 1];
          items.push(
            <TransitionCard
              key={`trans-${activity.clientKey || activity.originalIndex}`}
              fromActivity={activity}
              toActivity={nextAct}
              onEdit={() => onEditTransport(activity, nextAct)}
            />
          );
        } else {
          const successor = getSuccessor(activity);
          if (successor) {
            items.push(
              <TransitionCard
                key={`trans-${activity.clientKey || activity.originalIndex}`}
                fromActivity={activity}
                toActivity={successor}
                onEdit={() => onEditTransport(activity, successor)}
              />
            );
          }
        }
      }
      return items;
    })}

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

const ActivityModal = ({ visible, draft, setDraft, onClose, onSave }) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [initialLocation, setInitialLocation] = useState('');

  useEffect(() => {
    if (visible) {
      const loc = draft.location || '';
      setSearchText(loc);
      setInitialLocation(loc);
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!searchText.trim() || searchText === initialLocation) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPlaces(searchText);
        if (res.success && Array.isArray(res.data)) {
          setSearchResults(res.data);
          setShowDropdown(res.data.length > 0);
        }
      } catch (err) {
        console.error('Error searching places:', err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchText, initialLocation]);

  const parsePrice = (priceVal) => {
    if (!priceVal) return 0;
    const clean = String(priceVal).toLowerCase();
    if (clean.includes('miễn phí') || clean.includes('free')) return 0;
    const match = clean.replace(/[.,\s]/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const handleSelectResult = (place) => {
    setDraft((prev) => ({
      ...prev,
      location: place.name,
      address: place.address || '',
      category: getPlaceCategoryKey(place),
      cost: place.ticketPrice ? String(parsePrice(place.ticketPrice)) : '0',
      coordinates: place.coordinates || null,
      description: place.introduction || '',
    }));
    setSearchText(place.name);
    setInitialLocation(place.name);
    setSearchResults([]);
    setShowDropdown(false);
  };

  return (
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
              <View style={[styles.formGroup, { zIndex: 5000, position: 'relative' }]}>
                <Text style={styles.formLabel}>Tên địa điểm</Text>
                <View style={{ position: 'relative', zIndex: 1000 }}>

                  <TextInput
                    value={searchText}
                    onChangeText={(value) => {
                      setSearchText(value);
                      setDraft((prev) => ({ ...prev, location: value }));
                    }}
                    placeholder="Ví dụ: Ngũ Hành Sơn"
                    placeholderTextColor={COLORS.gray[400]}
                    style={styles.formInput}
                  />
                  {searching && (
                    <Text style={styles.searchingText}>Đang tìm...</Text>
                  )}
                  {showDropdown && searchResults.length > 0 && (
                    <View style={styles.dropdownContainer}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {searchResults.map((place) => (
                          <TouchableOpacity
                            key={place._id}
                            style={styles.dropdownItem}
                            onPress={() => handleSelectResult(place)}
                          >
                            <Ionicons name="location-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.dropdownItemTitle}>{place.name}</Text>
                              <Text style={styles.dropdownItemSubtitle} numberOfLines={1}>
                                {place.category} • {place.address || 'Không rõ địa chỉ'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

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
};


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
  daySummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  daySummaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
  },
  transitionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingLeft: 12,
  },
  transitionLineContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionLine: {
    width: 2,
    height: 32,
    backgroundColor: COLORS.gray[200],
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  transitionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  transitionIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  transitionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  transportRouteLabel: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginBottom: 6,
  },
  estimateButton: {
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  estimateButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
  searchingText: {
    fontSize: 11,
    color: COLORS.gray[400],
    position: 'absolute',
    right: 12,
    top: 15,
  },
  dropdownContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    marginTop: 4,
    maxHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 9999,
  },
  dropdownScroll: {
    padding: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
  dropdownItemSubtitle: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 2,
  },
});

const TransitionCard = ({ fromActivity, toActivity, onEdit }) => {
  const modeKey = toActivity.transport || 'OTHER';
  const mode = TRANSPORT_MODES[modeKey] || TRANSPORT_MODES.OTHER;
  const timeText = toActivity.travelTimeMinutes ? formatTransitionTime(toActivity.travelTimeMinutes) : '';
  const distText = toActivity.travelDistanceKm ? `${toActivity.travelDistanceKm} km` : '';

  const label = [timeText, distText].filter(Boolean).join(' • ');

  return (
    <View style={styles.transitionWrapper}>
      <View style={styles.transitionLineContainer}>
        <View style={styles.transitionLine} />
      </View>
      <TouchableOpacity style={styles.transitionCard} onPress={onEdit} activeOpacity={0.85}>
        <View style={[styles.transitionIconWrapper, { backgroundColor: `${mode.color}15` }]}>
          <Ionicons name={mode.icon} size={15} color={mode.color} />
        </View>
        <Text style={styles.transitionText}>
          {mode.label} {label ? `(${label})` : 'chưa có thông tin di chuyển'}
        </Text>
        <Ionicons name="pencil-sharp" size={11} color={COLORS.gray[400]} style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </View>
  );
};

const formatTransitionTime = (minutes) => {
  if (!minutes) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
  }
  return `${mins}m`;
};

const TransportModal = ({ visible, fromActivity, toActivity, onClose, onSave }) => {
  const [transport, setTransport] = useState('OTHER');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [distance, setDistance] = useState('0');
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    if (visible && toActivity) {
      setTransport(toActivity.transport || 'OTHER');
      const totalMinutes = Number(toActivity.travelTimeMinutes || 0);
      setHours(String(Math.floor(totalMinutes / 60)));
      setMinutes(String(totalMinutes % 60));
      setDistance(String(toActivity.travelDistanceKm || 0));
    }
  }, [visible, toActivity]);

  const mapToEstimateMode = (mode) => {
    if (mode === 'WALKING') return 'foot';
    if (mode === 'BIKE') return 'bike';
    if (mode === 'CAR' || mode === 'TAXI' || mode === 'GRAB') return 'car';
    return 'motorcycle'; // default
  };

  const handleEstimate = async () => {
    const fromCoords = fromActivity?.coordinates;
    const toCoords = toActivity?.coordinates;

    const fromLat = fromCoords?.lat || fromCoords?.latitude;
    const fromLng = fromCoords?.lng || fromCoords?.longitude;
    const toLat = toCoords?.lat || toCoords?.latitude;
    const toLng = toCoords?.lng || toCoords?.longitude;

    if (!fromLat || !fromLng || !toLat || !toLng) {
      Alert.alert('Thông tin', 'Cần có tọa độ địa lý của cả hai địa điểm để ước tính khoảng cách.');
      return;
    }

    setEstimating(true);
    try {
      const res = await getNavigationEstimate({
        fromLat,
        fromLng,
        toLat,
        toLng,
        vehicle: mapToEstimateMode(transport),
      });

      if (res.success && res.data) {
        const estMinutes = res.data.durationMinutes || 0;
        setHours(String(Math.floor(estMinutes / 60)));
        setMinutes(String(estMinutes % 60));
        setDistance(String(res.data.distanceKm || 0));
      } else {
        Alert.alert('Lỗi', 'Không thể tính toán dẫn đường.');
      }
    } catch (err) {
      console.error('Estimate route error:', err);
      const dist = getDistance(fromLat, fromLng, toLat, toLng) * 1.3;
      const speed = transport === 'WALKING' ? 4.5 : transport === 'BIKE' ? 15 : transport === 'CAR' ? 40 : 30;
      const estMinutes = Math.max(1, Math.round((dist / speed) * 60));
      setHours(String(Math.floor(estMinutes / 60)));
      setMinutes(String(estMinutes % 60));
      setDistance(String(dist.toFixed(1)));
    } finally {
      setEstimating(false);
    }
  };

  const handleSave = () => {
    const totalMinutes = (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);
    onSave({
      transport,
      travelTimeMinutes: totalMinutes,
      travelDistanceKm: parseFloat(distance) || 0,
    });
  };

  const showEstimateButton = !!(
    (fromActivity?.coordinates?.lat || fromActivity?.coordinates?.latitude) &&
    (toActivity?.coordinates?.lat || toActivity?.coordinates?.latitude)
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboard}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chặng di chuyển</Text>
              <TouchableOpacity style={styles.iconButtonSmall} onPress={onClose}>
                <Ionicons name="close" size={20} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.transportRouteLabel}>
                Từ: <Text style={{fontWeight: '700'}}>{fromActivity?.location || 'Địa điểm trước'}</Text>
              </Text>
              <Text style={[styles.transportRouteLabel, { marginBottom: 16 }]}>
                Đến: <Text style={{fontWeight: '700'}}>{toActivity?.location || 'Địa điểm sau'}</Text>
              </Text>

              <Text style={styles.formLabel}>Phương tiện di chuyển</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              >
                {Object.entries(TRANSPORT_MODES).map(([key, item]) => {
                  const selected = transport === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.categoryChip,
                        selected && { borderColor: item.color, backgroundColor: `${item.color}12` },
                      ]}
                      onPress={() => setTransport(key)}
                    >
                      <Ionicons name={item.icon} size={14} color={selected ? item.color : COLORS.gray[500]} />
                      <Text style={[styles.categoryText, selected && { color: item.color }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.inputRow}>
                <FormInput
                  label="Thời gian (Giờ)"
                  value={hours}
                  onChangeText={setHours}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.inputHalf}
                />
                <FormInput
                  label="Thời gian (Phút)"
                  value={minutes}
                  onChangeText={setMinutes}
                  placeholder="30"
                  keyboardType="numeric"
                  style={styles.inputHalf}
                />
              </View>

              <View style={styles.inputRow}>
                <FormInput
                  label="Khoảng cách (km)"
                  value={distance}
                  onChangeText={setDistance}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.inputHalf}
                />
                <View style={[styles.inputHalf, { justifyContent: 'flex-end', paddingBottom: 16 }]}>
                  {showEstimateButton && (
                    <TouchableOpacity
                      style={[styles.estimateButton, estimating && styles.actionButtonDisabled]}
                      onPress={handleEstimate}
                      disabled={estimating}
                    >
                      <Ionicons name="calculator-outline" size={16} color={COLORS.white} />
                      <Text style={styles.estimateButtonText}>
                        {estimating ? 'Đang tính...' : 'Tự động ước tính'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalSaveButton} onPress={handleSave}>
              <Text style={styles.modalSaveText}>Lưu chặng di chuyển</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default EditTripScreen;

