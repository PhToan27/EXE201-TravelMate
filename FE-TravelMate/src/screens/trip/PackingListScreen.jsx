import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Loading from '../../components/common/Loading';
import useTrip from '../../hooks/useTrip';
import { getPackingList, updatePackingList } from '../../services/trip/tripApi';
import { COLORS, RADIUS, SPACING } from '../../utils/constants';
import { formatDateRange, getDayCount } from '../../utils/dateUtils';

const MODE_OPTIONS = [
  { key: 'BEACH', label: 'Đi biển', icon: 'water-outline' },
  { key: 'MOUNTAIN', label: 'Leo núi', icon: 'trail-sign-outline' },
  { key: 'FLIGHT', label: 'Máy bay', icon: 'airplane-outline' },
  { key: 'FAMILY', label: 'Gia đình', icon: 'people-outline' },
  { key: 'FOOD', label: 'Ăn uống', icon: 'restaurant-outline' },
];

const PACKING_SECTIONS = [
  {
    key: 'documents',
    title: 'Giấy tờ quan trọng',
    icon: 'document-text-outline',
    items: [
      { id: 'cccd', name: 'CCCD / Hộ chiếu' },
      { id: 'booking', name: 'Xác nhận nơi ở' },
      { id: 'insurance', name: 'Bảo hiểm du lịch' },
    ],
  },
  {
    key: 'clothes',
    title: 'Đồ cá nhân',
    icon: 'shirt-outline',
    items: [
      { id: 'outfits', name: 'Quần áo theo số ngày' },
      { id: 'sleepwear', name: 'Đồ ngủ' },
      { id: 'underwear', name: 'Đồ lót / tất' },
      { id: 'jacket', name: 'Áo khoác mỏng' },
      { id: 'toiletries', name: 'Bàn chải, kem đánh răng' },
    ],
  },
  {
    key: 'electronics',
    title: 'Đồ điện tử',
    icon: 'phone-portrait-outline',
    items: [
      { id: 'phone-charger', name: 'Điện thoại & sạc' },
      { id: 'power-bank', name: 'Sạc dự phòng' },
      { id: 'camera', name: 'Máy ảnh / thẻ nhớ' },
    ],
  },
  {
    key: 'health',
    title: 'Sức khỏe',
    icon: 'medical-outline',
    items: [
      { id: 'personal-medicine', name: 'Thuốc cá nhân' },
      { id: 'first-aid', name: 'Băng cá nhân / thuốc sát trùng' },
      { id: 'hand-sanitizer', name: 'Khăn giấy / nước rửa tay' },
    ],
  },
];

const MODE_SUGGESTIONS = {
  BEACH: {
    title: 'AI gợi ý cho đi biển',
    icon: 'sparkles-outline',
    items: [
      { id: 'swimwear', name: 'Đồ bơi' },
      { id: 'sunscreen', name: 'Kem chống nắng' },
      { id: 'sunglasses', name: 'Kính râm' },
      { id: 'flip-flops', name: 'Dép đi biển' },
      { id: 'waterproof-bag', name: 'Túi chống nước' },
      { id: 'beach-towel', name: 'Khăn tắm nhanh khô' },
    ],
  },
  MOUNTAIN: {
    title: 'AI gợi ý cho leo núi',
    icon: 'sparkles-outline',
    items: [
      { id: 'hiking-shoes', name: 'Giày leo núi / giày thể thao bám tốt' },
      { id: 'raincoat', name: 'Áo mưa mỏng' },
      { id: 'insect-repellent', name: 'Xịt chống côn trùng' },
      { id: 'flashlight', name: 'Đèn pin nhỏ' },
      { id: 'water-bottle', name: 'Bình nước cá nhân' },
      { id: 'energy-snack', name: 'Đồ ăn năng lượng' },
    ],
  },
  FLIGHT: {
    title: 'Cần mang khi đi máy bay',
    icon: 'airplane-outline',
    items: [
      { id: 'flight-ticket', name: 'Vé máy bay / mã đặt chỗ' },
      { id: 'passport-id', name: 'CCCD / hộ chiếu đúng hạn' },
      { id: 'carry-on-liquids', name: 'Chai lọ dưới 100ml trong hành lý xách tay' },
      { id: 'neck-pillow', name: 'Gối cổ / áo khoác nhẹ' },
      { id: 'earbuds', name: 'Tai nghe' },
      { id: 'luggage-tag', name: 'Thẻ tên hành lý' },
    ],
  },
  FAMILY: {
    title: 'AI gợi ý cho gia đình',
    icon: 'sparkles-outline',
    items: [
      { id: 'kids-clothes', name: 'Quần áo dự phòng cho trẻ' },
      { id: 'snacks', name: 'Đồ ăn nhẹ' },
      { id: 'wet-wipes', name: 'Khăn ướt' },
      { id: 'small-toy', name: 'Đồ chơi nhỏ / sách' },
    ],
  },
  FOOD: {
    title: 'AI gợi ý cho lịch trình ăn uống',
    icon: 'sparkles-outline',
    items: [
      { id: 'digestive-medicine', name: 'Thuốc tiêu hóa' },
      { id: 'cash-small', name: 'Tiền mặt mệnh giá nhỏ' },
      { id: 'food-notes', name: 'Danh sách món muốn thử' },
    ],
  },
};

const DESTINATION_KEYWORDS = {
  BEACH: ['biển', 'beach', 'đảo', 'dao', 'nha trang', 'phú quốc', 'phu quoc', 'vũng tàu', 'vung tau', 'đà nẵng', 'da nang', 'quy nhơn', 'quy nhon'],
  MOUNTAIN: ['núi', 'nui', 'mountain', 'sapa', 'sa pa', 'đà lạt', 'da lat', 'hà giang', 'ha giang', 'tây bắc', 'tay bac'],
};

const normalize = (value = '') => String(value).toLowerCase();

const inferModes = (trip) => {
  const text = normalize(`${trip?.destination || ''} ${trip?.travelStyle || ''}`);
  const modes = new Set();

  MODE_OPTIONS.forEach((mode) => {
    if (text.includes(mode.key.toLowerCase())) modes.add(mode.key);
  });

  Object.entries(DESTINATION_KEYWORDS).forEach(([mode, keywords]) => {
    if (keywords.some((keyword) => text.includes(keyword))) modes.add(mode);
  });

  if (!modes.size) modes.add('BEACH');
  return Array.from(modes);
};

const buildItems = (selectedModes, customItems) => {
  const aiSections = selectedModes
    .filter((mode) => MODE_SUGGESTIONS[mode])
    .map((mode) => ({
      key: `mode-${mode}`,
      title: MODE_SUGGESTIONS[mode].title,
      icon: MODE_SUGGESTIONS[mode].icon,
      highlight: true,
      items: MODE_SUGGESTIONS[mode].items,
    }));

  const customSection = customItems.length
    ? [{ key: 'custom', title: 'Món tự thêm', icon: 'add-circle-outline', items: customItems }]
    : [];

  return [...aiSections, ...PACKING_SECTIONS, ...customSection];
};

const PackingListScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;
  const { currentTrip: trip, isLoading, fetchTripById } = useTrip();

  const [selectedModes, setSelectedModes] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [customItems, setCustomItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTripById(tripId);
  }, [tripId]);

  useEffect(() => {
    const loadPacking = async () => {
      try {
        const result = await getPackingList(tripId);
        if (result.success && result.data) {
          setSelectedModes(result.data.selectedModes || []);
          setCheckedItems(result.data.checkedItems || {});
          setCustomItems(result.data.customItems || []);
          setHasLoadedDraft(true);
          return;
        }
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể tải danh sách hành lý từ máy chủ.');
      }
      setHasLoadedDraft(true);
    };

    loadPacking();
  }, [tripId]);

  useEffect(() => {
    if (trip && hasLoadedDraft && selectedModes.length === 0) {
      setSelectedModes(inferModes(trip));
    }
  }, [trip, hasLoadedDraft, selectedModes.length]);

  const sections = useMemo(
    () => buildItems(selectedModes, customItems),
    [selectedModes, customItems]
  );

  const allItems = useMemo(
    () => sections.flatMap((section) => section.items.map((item) => item.id)),
    [sections]
  );
  const checkedCount = allItems.filter((id) => checkedItems[id]).length;
  const progress = allItems.length ? Math.round((checkedCount / allItems.length) * 100) : 0;

  const toggleMode = (mode) => {
    setSelectedModes((prev) => {
      if (prev.includes(mode)) return prev.filter((item) => item !== mode);
      return [...prev, mode];
    });
  };

  const toggleItem = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addCustomItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    const id = `custom-${Date.now()}`;
    setCustomItems((prev) => [...prev, { id, name }]);
    setCheckedItems((prev) => ({ ...prev, [id]: false }));
    setNewItemName('');
    setModalVisible(false);
  };

  const removeCustomItem = (id) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
    setCheckedItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const savePacking = async () => {
    setSaving(true);
    try {
      await updatePackingList(tripId, { selectedModes, checkedItems, customItems });
      Alert.alert('Đã lưu', 'Danh sách hành lý đã được lưu cho chuyến đi này.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu danh sách hành lý.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !trip || !hasLoadedDraft) {
    return <Loading message="Đang chuẩn bị danh sách..." />;
  }

  const dayCount = getDayCount(trip.startDate, trip.endDate);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuẩn bị hành lý</Text>
        <TouchableOpacity style={styles.iconButton} onPress={savePacking} disabled={saving}>
          <Ionicons name={saving ? 'sync-outline' : 'checkmark'} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tripCard}>
          <View style={styles.tripIcon}>
            <Ionicons name="airplane-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.tripEyebrow}>Thông tin chuyến đi</Text>
            <Text style={styles.destination} numberOfLines={1}>
              {trip.destination || 'Chuyến đi của bạn'}
            </Text>
            <Text style={styles.tripDate}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
            <Text style={styles.tripMeta}>{dayCount} ngày - {trip.totalPeople || 1} người</Text>
          </View>
        </View>

        <View style={styles.weatherCard}>
          <View style={styles.weatherIcon}>
            <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.weatherTextWrap}>
            <Text style={styles.weatherTitle}>Gợi ý theo chuyến đi</Text>
            <Text style={styles.weatherText}>Chọn loại hình phù hợp để AI gợi ý đồ cần mang.</Text>
          </View>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Tiến độ chuẩn bị</Text>
            <Text style={styles.progressValue}>
              {checkedCount}/{allItems.length} vật dụng
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeList}
        >
          {MODE_OPTIONS.map((mode) => {
            const active = selectedModes.includes(mode.key);
            return (
              <TouchableOpacity
                key={mode.key}
                style={[styles.modeChip, active && styles.modeChipActive]}
                onPress={() => toggleMode(mode.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={mode.icon}
                  size={15}
                  color={active ? COLORS.primary : COLORS.gray[500]}
                />
                <Text style={[styles.modeText, active && styles.modeTextActive]}>{mode.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {sections.map((section) => (
          <PackingSection
            key={section.key}
            section={section}
            checkedItems={checkedItems}
            onToggle={toggleItem}
            onAdd={() => setModalVisible(true)}
            onRemove={removeCustomItem}
          />
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={savePacking}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu danh sách'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thêm vật dụng</Text>
            <TextInput
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Ví dụ: Thuốc say xe"
              placeholderTextColor={COLORS.gray[400]}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={addCustomItem}>
                <Text style={styles.modalSaveText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const PackingSection = ({ section, checkedItems, onToggle, onAdd, onRemove }) => (
  <View style={[styles.section, section.highlight && styles.aiSection]}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <Ionicons name={section.icon} size={16} color={section.highlight ? COLORS.primary : COLORS.gray[700]} />
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    </View>

    {section.items.map((item) => {
      const checked = !!checkedItems[item.id];
      const isCustom = section.key === 'custom';
      return (
        <View key={item.id} style={styles.itemRow}>
          <TouchableOpacity
            style={[styles.checkbox, checked && styles.checkboxChecked]}
            onPress={() => onToggle(item.id)}
            activeOpacity={0.8}
          >
            {checked && <Ionicons name="checkmark" size={12} color={COLORS.white} />}
          </TouchableOpacity>
          <Text style={[styles.itemText, checked && styles.itemTextChecked]} numberOfLines={2}>
            {item.name}
          </Text>
          {isCustom && (
            <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(item.id)}>
              <Ionicons name="close" size={15} color={COLORS.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      );
    })}

    <TouchableOpacity style={styles.addLine} onPress={onAdd}>
      <Text style={styles.addLineText}>+ Thêm vật dụng mới...</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
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
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray[700],
  },
  content: { flex: 1 },
  contentInner: { padding: SPACING.md },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  tripIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  tripInfo: { flex: 1, minWidth: 0 },
  tripEyebrow: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: COLORS.primary,
    fontWeight: '900',
    marginBottom: 2,
  },
  destination: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: 3,
  },
  tripDate: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[500],
  },
  tripMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[400],
    marginTop: 2,
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  weatherIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  weatherTextWrap: { flex: 1 },
  weatherTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.gray[800],
  },
  weatherText: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  progressWrap: {
    marginBottom: SPACING.md,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray[700],
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.gray[200],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  modeList: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  modeChip: {
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
  modeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF7ED',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray[500],
  },
  modeTextActive: { color: COLORS.primary },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  aiSection: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBF7',
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.gray[800],
  },
  itemRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[700],
    lineHeight: 18,
  },
  itemTextChecked: {
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLine: {
    paddingTop: SPACING.sm,
  },
  addLineText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[400],
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  saveButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.75 },
  saveText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  modalInput: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  modalCancel: {
    height: 40,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gray[500],
  },
  modalSave: {
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
});

export default PackingListScreen;
