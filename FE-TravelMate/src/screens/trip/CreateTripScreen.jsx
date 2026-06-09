import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import useTrip from '../../hooks/useTrip';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

const { width } = Dimensions.get('window'); // <-- Thêm dòng này để lấy kích thước chiều rộng màn hình


// ----- Helper -----
const toDateString = (date) => date.toISOString().split('T')[0]; // YYYY-MM-DD

const formatDisplay = (date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

// ----- Date Picker Row -----
const DatePickerRow = ({ label, date, onPress, error }) => (
  <View style={dpStyles.container}>
    <Text style={dpStyles.label}>{label}</Text>
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[dpStyles.row, error && dpStyles.rowError]}
    >
      <Ionicons name="calendar-outline" size={18} color={COLORS.gray[400]} style={dpStyles.icon} />
      <Text style={dpStyles.value}>{formatDisplay(date)}</Text>
    </TouchableOpacity>
    {error ? <Text style={dpStyles.error}>{error}</Text> : null}
  </View>
);

const dpStyles = StyleSheet.create({
  container: { flex: 1, marginBottom: SPACING.md },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  rowError: { borderColor: COLORS.error },
  icon: { marginRight: SPACING.sm },
  value: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  error: {
    fontSize: 11,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 2,
  },
});

// ----- Main Screen -----
const today = new Date();
const defaultEnd = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

const CreateTripScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { createTrip, isCreating } = useTrip();
  const submitLockRef = useRef(false);
  const [destination, setDestination] = useState('');
  const [startDateObj, setStartDateObj] = useState(today);
  const [endDateObj, setEndDateObj] = useState(defaultEnd);
  const [budget, setBudget] = useState('');
  const [people, setPeople] = useState('2');
  const [travelStyles, setTravelStyles] = useState(['BEACH']); // Default select BEACH
  const [errors, setErrors] = useState({});

  const toggleTravelStyle = (value) => {
    if (travelStyles.includes(value)) {
      if (travelStyles.length > 1) {
        setTravelStyles(travelStyles.filter(style => style !== value));
      }
    } else {
      setTravelStyles([...travelStyles, value]);
    }
  };

  // Picker modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('start'); // 'start' | 'end'
  const [tempDate, setTempDate] = useState(today);

  const openPicker = (target) => {
    setPickerTarget(target);
    setTempDate(target === 'start' ? startDateObj : endDateObj);
    setPickerVisible(true);
  };

  const confirmPicker = () => {
    const selectedDate = tempDate instanceof Date ? tempDate : new Date();

    if (pickerTarget === 'start') {
      setStartDateObj(selectedDate);

      if (endDateObj < selectedDate) {
        setEndDateObj(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
      }

      setErrors((e) => ({ ...e, startDate: '' }));
    } else {
      setEndDateObj(selectedDate);
      setErrors((e) => ({ ...e, endDate: '' }));
    }

    setPickerVisible(false);
  };

  const validate = () => {
    const e = {};
    if (!destination.trim()) e.destination = 'Vui lòng nhập điểm đến';
    if (endDateObj <= startDateObj) e.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (submitLockRef.current || isCreating) return;
    if (!validate()) return;

    submitLockRef.current = true;

    try {
      const result = await createTrip({
        destination: destination.trim(),
        startDate: toDateString(startDateObj),
        endDate: toDateString(endDateObj),
        budget: budget ? parseInt(budget.replace(/[^\d]/g, ''), 10) : 0,
        people: parseInt(people, 10) || 1,
        travelStyle: travelStyles.join(', '),
        generateAiItinerary: true,
      });

      if (result.success) {
        navigation.replace('TripDetail', { tripId: result.data._id });
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể tạo chuyến đi');
      }
    } finally {
      submitLockRef.current = false;
    }
  };
  const travelStylesList = [
    { value: 'FOOD', label: 'Ăn uống', icon: 'restaurant-outline' },
    { value: 'BEACH', label: 'Biển', icon: 'water-outline' },
    { value: 'CULTURE', label: 'Văn hóa', icon: 'library-outline' },
    { value: 'NATURE', label: 'Thiên nhiên', icon: 'leaf-outline' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Header title="Tạo chuyến đi" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Lên kế hoạch mới</Text>
          <Text style={styles.subTitle}>
            Hãy điền thông tin để TravelMate gợi ý lịch trình tốt nhất cho bạn.
          </Text>
        </View>

        {/* Input Fields */}
        <View style={styles.form}>

          {/* Destination */}
          <CustomInput
            label="ĐIỂM ĐẾN *"
            value={destination}
            onChangeText={(t) => { setDestination(t); setErrors((e) => ({ ...e, destination: '' })); }}
            placeholder="Ví dụ: Đà Nẵng, Việt Nam"
            error={errors.destination}
            leftIcon={<Ionicons name="location-outline" size={18} color={COLORS.gray[400]} />}
          />

          {/* Dates Row (Side-by-side) */}
          <View style={styles.row}>
            <DatePickerRow
              label="NGÀY ĐI *"
              date={startDateObj}
              onPress={() => openPicker('start')}
              error={errors.startDate}
            />
            <View style={{ width: SPACING.md }} />
            <DatePickerRow
              label="NGÀY VỀ *"
              date={endDateObj}
              onPress={() => openPicker('end')}
              error={errors.endDate}
            />
          </View>

          {/* People & Budget Row (Side-by-side) */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <CustomInput
                label="SỐ NGƯỜI"
                value={people}
                onChangeText={setPeople}
                placeholder="1"
                keyboardType="numeric"
                leftIcon={<Ionicons name="people-outline" size={18} color={COLORS.gray[400]} />}
              />
            </View>
            <View style={{ width: SPACING.md }} />
            <View style={{ flex: 1 }}>
              <CustomInput
                label="NGÂN SÁCH (VND)"
                value={budget}
                onChangeText={setBudget}
                placeholder="VND"
                keyboardType="numeric"
                leftIcon={<Ionicons name="wallet-outline" size={18} color={COLORS.gray[400]} />}
              />
            </View>
          </View>

          {/* Travel Style Grid */}
          <View style={styles.styleSection}>
            <Text style={styles.styleSectionLabel}>PHONG CÁCH DU LỊCH</Text>
            <View style={styles.styleGrid}>
              {travelStylesList.map((item) => {
                const isActive = travelStyles.includes(item.value);
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.styleChip,
                      isActive && styles.styleChipActive,
                    ]}
                    onPress={() => toggleTravelStyle(item.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={isActive ? COLORS.primary : COLORS.gray[500]}
                    />
                    <Text style={[styles.styleChipLabel, isActive && styles.styleChipLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Generate Button */}
        <CustomButton
          title={isCreating ? 'Đang tạo lịch trình...' : 'Tạo lịch trình'}
          onPress={handleCreate}
          loading={isCreating}
          disabled={isCreating}
          style={styles.createBtn}
          icon={<Ionicons name="rocket-outline" size={18} color={COLORS.white} />}
        />
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.sm }]}>
            <View style={styles.handleBar} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {pickerTarget === 'start' ? 'Ngày đi' : 'Ngày về'}
              </Text>
              <TouchableOpacity onPress={confirmPicker} style={styles.modalDoneBtn}>
                <Text style={styles.modalDoneText}>Xong</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate instanceof Date ? tempDate : new Date()}
              mode="date"
              display="spinner"
              locale="vi-VN"
              minimumDate={pickerTarget === 'end' ? startDateObj : new Date()}
              onChange={(event, selectedDate) => {
                if (selectedDate instanceof Date) {
                  setTempDate(selectedDate);
                }
              }}
              style={styles.datePicker}
              textColor={COLORS.black}
              themeVariant="light"
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    padding: SPACING.md,
  },
  titleContainer: {
    marginVertical: SPACING.md,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    lineHeight: 18,
  },
  form: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  styleSection: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  styleSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginBottom: 10,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  styleChip: {
    width: (width - SPACING.md * 2 - SPACING.md) / 2, // 2 columns layout
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  styleChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: COLORS.primary,
  },
  styleChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  styleChipLabelActive: {
    color: COLORS.primary,
  },
  createBtn: {
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.sm,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray[300],
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  modalCancelBtn: { padding: 4 },
  modalCancelText: {
    fontSize: 15,
    color: COLORS.gray[500],
  },
  modalDoneBtn: { padding: 4 },
  modalDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  datePicker: {
    width: '100%',
    height: 216,
    backgroundColor: COLORS.white,
  },
});

export default CreateTripScreen;
