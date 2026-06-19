import React, { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import CustomButton from '../../components/common/CustomButton';
import CustomInput from '../../components/common/CustomInput';
import { createItineraryPreview } from '../../services/itineraryPreview/itineraryPreviewApi';
import { COLORS, RADIUS, SPACING } from '../../utils/constants';

const DAY_MS = 24 * 60 * 60 * 1000;
const today = new Date();
const defaultEndDate = new Date(today.getTime() + DAY_MS);

const interestOptions = [
  { label: 'Ăn uống', icon: 'restaurant-outline' },
  { label: 'Thiên nhiên', icon: 'leaf-outline' },
  { label: 'Văn hóa', icon: 'library-outline' },
  { label: 'Biển', icon: 'water-outline' },
  { label: 'Phiêu lưu', icon: 'trail-sign-outline' },
  { label: 'Chụp ảnh', icon: 'camera-outline' },
  { label: 'Mua sắm', icon: 'bag-outline' },
  { label: 'Thư giãn', icon: 'sunny-outline' },
];

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (date) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const DateField = ({ label, date, onPress, error }) => (
  <View style={styles.dateField}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TouchableOpacity style={[styles.dateButton, error && styles.inputError]} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name="calendar-outline" size={18} color={COLORS.gray[500]} />
      <Text style={styles.dateValue}>{formatDate(date)}</Text>
    </TouchableOpacity>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const ItineraryPreviewScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const submitLockRef = useRef(false);
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [people, setPeople] = useState('2');
  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState(['Ăn uống']);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [emptyMessage, setEmptyMessage] = useState('');
  const [picker, setPicker] = useState(null);
  const [temporaryDate, setTemporaryDate] = useState(today);

  const tripDays = useMemo(() => {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(0, 0, 0, 0);
    return Math.round((end - start) / DAY_MS) + 1;
  }, [startDate, endDate]);

  const toggleInterest = (interest) => {
    setInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]
    );
    setErrors((current) => ({ ...current, interests: '' }));
  };

  const openDatePicker = (target) => {
    setTemporaryDate(target === 'start' ? startDate : endDate);
    setPicker(target);
  };

  const confirmDate = () => {
    if (picker === 'start') {
      setStartDate(temporaryDate);
      if (temporaryDate > endDate) setEndDate(temporaryDate);
      setErrors((current) => ({ ...current, startDate: '', endDate: '' }));
    } else {
      setEndDate(temporaryDate);
      setErrors((current) => ({ ...current, endDate: '' }));
    }
    setPicker(null);
  };

  const validate = () => {
    const nextErrors = {};
    const numericPeople = Number(people);
    const numericBudget = Number(budget.replace(/[^\d]/g, ''));
    if (!destination.trim()) nextErrors.destination = 'Vui lòng nhập điểm đến.';
    if (endDate < startDate) nextErrors.endDate = 'Ngày về không được trước ngày đi.';
    if (!Number.isInteger(numericPeople) || numericPeople < 1 || numericPeople > 50) {
      nextErrors.people = 'Nhập số người từ 1 đến 50.';
    }
    if (!budget.trim() || !Number.isFinite(numericBudget) || numericBudget <= 0) {
      nextErrors.budget = 'Vui lòng nhập ngân sách lớn hơn 0.';
    }
    if (!interests.length) nextErrors.interests = 'Chọn ít nhất một sở thích.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (submitLockRef.current || isLoading || !validate()) return;
    submitLockRef.current = true;
    setIsLoading(true);
    setErrorMessage('');
    setEmptyMessage('');
    try {
      const result = await createItineraryPreview({
        destination: destination.trim(),
        startDate: toDateString(startDate),
        endDate: toDateString(endDate),
        people: Number(people),
        budget: Number(budget.replace(/[^\d]/g, '')),
        interests,
      });
      setPreview(result.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Chưa thể tạo gợi ý lúc này. Vui lòng thử lại sau.';
      if (error.response?.status === 404) setEmptyMessage(message);
      else setErrorMessage(message);
    } finally {
      setIsLoading(false);
      submitLockRef.current = false;
    }
  };

  const resetPreview = () => {
    setPreview(null);
    setErrorMessage('');
    setEmptyMessage('');
  };

  if (preview) {
    return (
      <View style={styles.container}>
        <Header title="Lịch trình gợi ý" onBack={resetPreview} />
        <ScrollView contentContainerStyle={[styles.resultScroll, { paddingBottom: insets.bottom + SPACING.xl }]} showsVerticalScrollIndicator={false}>
          <View style={styles.previewBanner}>
            <Ionicons name="eye-outline" size={22} color={COLORS.primary} />
            <View style={styles.previewBannerText}>
              <Text style={styles.previewBannerTitle}>Bản xem trước</Text>
              <Text style={styles.previewBannerDescription}>Gợi ý này chưa tạo thành chuyến đi và không được lưu lại.</Text>
            </View>
          </View>
          <Text style={styles.resultTitle}>Khám phá {preview.destination}</Text>
          <Text style={styles.resultSubtitle}>
            {formatDate(new Date(`${preview.startDate}T00:00:00`))} - {formatDate(new Date(`${preview.endDate}T00:00:00`))}
            {'  '}·{'  '}{preview.people} người
          </Text>
          <View style={styles.costCard}>
            <View>
              <Text style={styles.costCaption}>Chi phí hoạt động dự kiến</Text>
              <Text style={styles.costValue}>{formatCurrency(preview.estimatedTotalCost)}</Text>
            </View>
            <Ionicons name="wallet-outline" size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.budgetNote}>{preview.budgetMessage}</Text>

          {preview.days.map((day) => (
            <View key={day.day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayNumber}><Text style={styles.dayNumberText}>{day.day}</Text></View>
                <View>
                  <Text style={styles.dayTitle}>{day.title}</Text>
                  <Text style={styles.dayDate}>{formatDate(new Date(`${day.date}T00:00:00`))}</Text>
                </View>
              </View>
              {day.activities.map((activity, index) => (
                <View key={`${day.day}-${activity.place}-${index}`} style={styles.activityRow}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.activityTime}>{activity.timeSlot}</Text>
                    {index < day.activities.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.activityContent}>
                    <View style={styles.activityTopLine}>
                      <Text style={styles.activityPlace}>{activity.place}</Text>
                      <View style={styles.typeChip}><Text style={styles.typeChipText}>{activity.activityType}</Text></View>
                    </View>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    {activity.address ? <Text style={styles.activityAddress}>{activity.address}</Text> : null}
                    <View style={styles.activityMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="car-outline" size={15} color={COLORS.gray[500]} />
                        <Text style={styles.metaText}>{activity.suggestedTransport}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="cash-outline" size={15} color={COLORS.gray[500]} />
                        <Text style={styles.metaText}>{formatCurrency(activity.estimatedCost)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}
          <CustomButton title="Tạo gợi ý khác" variant="secondary" onPress={resetPreview} icon={<Ionicons name="refresh-outline" size={18} color={COLORS.primary} />} />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Gợi ý lịch trình" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + SPACING.xl }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="sparkles-outline" size={26} color={COLORS.primary} /></View>
          <Text style={styles.heroTitle}>Lên lịch thử cho chuyến đi của bạn</Text>
          <Text style={styles.heroDescription}>Chọn thông tin bên dưới, TravelMate sẽ sắp xếp gợi ý để bạn xem trước. Bạn chưa cần tạo chuyến đi thật.</Text>
        </View>
        <CustomInput
          label="ĐIỂM ĐẾN *"
          value={destination}
          onChangeText={(value) => { setDestination(value); setErrors((current) => ({ ...current, destination: '' })); }}
          placeholder="Ví dụ: Đà Nẵng"
          error={errors.destination}
          leftIcon={<Ionicons name="location-outline" size={18} color={COLORS.gray[400]} />}
        />
        <View style={styles.dateRow}>
          <DateField label="NGÀY ĐI *" date={startDate} onPress={() => openDatePicker('start')} error={errors.startDate} />
          <DateField label="NGÀY VỀ *" date={endDate} onPress={() => openDatePicker('end')} error={errors.endDate} />
        </View>
        <Text style={styles.tripLength}>{tripDays > 0 ? `${tripDays} ngày dự kiến` : 'Vui lòng chọn lại ngày'}</Text>
        <View style={styles.inputRow}>
          <CustomInput
            label="SỐ NGƯỜI *" value={people} keyboardType="numeric" error={errors.people} style={styles.halfInput}
            onChangeText={(value) => { setPeople(value.replace(/[^\d]/g, '')); setErrors((current) => ({ ...current, people: '' })); }}
            placeholder="2" leftIcon={<Ionicons name="people-outline" size={18} color={COLORS.gray[400]} />}
          />
          <CustomInput
            label="NGÂN SÁCH *" value={budget} keyboardType="numeric" error={errors.budget} style={styles.halfInput}
            onChangeText={(value) => { setBudget(value.replace(/[^\d]/g, '')); setErrors((current) => ({ ...current, budget: '' })); }}
            placeholder="Ví dụ: 2000000" leftIcon={<Ionicons name="wallet-outline" size={18} color={COLORS.gray[400]} />}
          />
        </View>
        <Text style={styles.inputHint}>Ngân sách áp dụng cho cả nhóm trong thời gian bạn chọn.</Text>
        <View style={styles.interestSection}>
          <Text style={styles.inputLabel}>SỞ THÍCH *</Text>
          <Text style={styles.sectionHint}>Chọn những điều bạn muốn ưu tiên trong lịch trình.</Text>
          <View style={styles.interestGrid}>
            {interestOptions.map((interest) => {
              const selected = interests.includes(interest.label);
              return (
                <TouchableOpacity key={interest.label} style={[styles.interestChip, selected && styles.interestChipSelected]} onPress={() => toggleInterest(interest.label)} activeOpacity={0.75}>
                  <Ionicons name={interest.icon} size={17} color={selected ? COLORS.primary : COLORS.gray[500]} />
                  <Text style={[styles.interestLabel, selected && styles.interestLabelSelected]}>{interest.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.interests ? <Text style={styles.errorText}>{errors.interests}</Text> : null}
        </View>
        {emptyMessage ? (
          <View style={styles.messageCard}>
            <Ionicons name="compass-outline" size={28} color={COLORS.warning} />
            <Text style={styles.messageTitle}>Chưa có điểm phù hợp</Text>
            <Text style={styles.messageDescription}>{emptyMessage}</Text>
          </View>
        ) : null}
        {errorMessage ? (
          <View style={[styles.messageCard, styles.errorCard]}>
            <Ionicons name="alert-circle-outline" size={28} color={COLORS.error} />
            <Text style={styles.messageTitle}>Không thể tạo gợi ý</Text>
            <Text style={styles.messageDescription}>{errorMessage}</Text>
          </View>
        ) : null}
        <CustomButton title={isLoading ? 'Đang tạo gợi ý...' : 'Tạo lịch trình gợi ý'} onPress={handleGenerate} loading={isLoading} disabled={isLoading} icon={<Ionicons name="sparkles-outline" size={18} color={COLORS.white} />} style={styles.generateButton} />
      </ScrollView>
      <Modal visible={Boolean(picker)} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.sm }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPicker(null)}><Text style={styles.modalCancel}>Hủy</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>{picker === 'start' ? 'Chọn ngày đi' : 'Chọn ngày về'}</Text>
              <TouchableOpacity onPress={confirmDate}><Text style={styles.modalConfirm}>Xong</Text></TouchableOpacity>
            </View>
            <DateTimePicker value={temporaryDate} mode="date" display="spinner" locale="vi-VN" minimumDate={picker === 'end' ? startDate : new Date()} onChange={(_, selectedDate) => selectedDate && setTemporaryDate(selectedDate)} style={styles.picker} textColor={COLORS.black} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  formScroll: { padding: SPACING.md },
  hero: { marginBottom: SPACING.lg },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  heroTitle: { fontSize: 22, color: COLORS.black, fontWeight: '800', marginBottom: 6 },
  heroDescription: { fontSize: 14, color: COLORS.gray[500], lineHeight: 20 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray[700], marginBottom: 7 },
  dateRow: { flexDirection: 'row', gap: SPACING.sm },
  dateField: { flex: 1 },
  dateButton: { height: 52, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gray[200], backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateValue: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 11, color: COLORS.error, marginTop: 4 },
  tripLength: { fontSize: 12, color: COLORS.gray[500], marginTop: SPACING.sm, marginBottom: SPACING.md },
  inputRow: { flexDirection: 'row', gap: SPACING.sm },
  halfInput: { flex: 1 },
  inputHint: { color: COLORS.gray[500], fontSize: 12, marginTop: -SPACING.sm, marginBottom: SPACING.lg },
  interestSection: { marginBottom: SPACING.lg },
  sectionHint: { color: COLORS.gray[500], fontSize: 12, marginBottom: SPACING.sm },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  interestChip: { width: '48.7%', minHeight: 46, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gray[200], backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 7 },
  interestChipSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF7ED' },
  interestLabel: { color: COLORS.gray[600], fontSize: 13, fontWeight: '600' },
  interestLabelSelected: { color: COLORS.primary },
  generateButton: { marginTop: SPACING.xs },
  messageCard: { backgroundColor: '#FFFBEB', borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.md },
  errorCard: { backgroundColor: '#FEF2F2' },
  messageTitle: { fontSize: 15, color: COLORS.black, fontWeight: '700', marginTop: SPACING.sm },
  messageDescription: { fontSize: 13, color: COLORS.gray[600], textAlign: 'center', lineHeight: 19, marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: SPACING.sm },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.gray[300], alignSelf: 'center', marginBottom: SPACING.sm },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  modalCancel: { fontSize: 15, color: COLORS.gray[500] },
  modalTitle: { fontSize: 16, color: COLORS.black, fontWeight: '700' },
  modalConfirm: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
  picker: { width: '100%', height: 216 },
  resultScroll: { padding: SPACING.md },
  previewBanner: { flexDirection: 'row', backgroundColor: '#FFF7ED', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  previewBannerText: { flex: 1 },
  previewBannerTitle: { fontSize: 14, color: COLORS.primary, fontWeight: '800', marginBottom: 2 },
  previewBannerDescription: { fontSize: 12, color: COLORS.gray[600], lineHeight: 17 },
  resultTitle: { fontSize: 24, color: COLORS.black, fontWeight: '800', marginTop: SPACING.lg },
  resultSubtitle: { fontSize: 13, color: COLORS.gray[500], marginTop: 5 },
  costCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md },
  costCaption: { fontSize: 12, color: COLORS.gray[500] },
  costValue: { fontSize: 20, color: COLORS.black, fontWeight: '800', marginTop: 4 },
  budgetNote: { fontSize: 12, color: COLORS.gray[500], lineHeight: 17, marginTop: SPACING.sm, marginBottom: SPACING.lg },
  dayCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  dayNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  dayNumberText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  dayTitle: { fontSize: 16, color: COLORS.black, fontWeight: '800' },
  dayDate: { fontSize: 12, color: COLORS.gray[500], marginTop: 2 },
  activityRow: { flexDirection: 'row', minHeight: 116 },
  timeColumn: { width: 74, alignItems: 'center' },
  activityTime: { color: COLORS.primary, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.gray[200], marginTop: 6, marginBottom: -4 },
  activityContent: { flex: 1, paddingBottom: SPACING.md, paddingLeft: SPACING.sm },
  activityTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.sm },
  activityPlace: { flex: 1, color: COLORS.black, fontSize: 15, fontWeight: '800' },
  typeChip: { backgroundColor: '#FFF7ED', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  typeChipText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  activityDescription: { color: COLORS.gray[600], fontSize: 12, lineHeight: 18, marginTop: 4 },
  activityAddress: { color: COLORS.gray[500], fontSize: 11, marginTop: 4 },
  activityMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.gray[600], fontSize: 11 },
});

export default ItineraryPreviewScreen;
