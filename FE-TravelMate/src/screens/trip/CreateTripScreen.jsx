import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import useTrip from '../../hooks/useTrip';
import { COLORS, SPACING, RADIUS, TRAVEL_STYLES } from '../../utils/constants';

const CreateTripScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { createTrip, isCreating } = useTrip();

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [people, setPeople] = useState('2');
  const [travelStyle, setTravelStyle] = useState('CHILL');
  const [interests, setInterests] = useState('');
  const [hotelArea, setHotelArea] = useState('');
  const [generateAI, setGenerateAI] = useState(true);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!destination.trim()) e.destination = 'Vui lòng nhập điểm đến';
    if (!startDate.trim()) e.startDate = 'Vui lòng nhập ngày bắt đầu (YYYY-MM-DD)';
    if (!endDate.trim()) e.endDate = 'Vui lòng nhập ngày kết thúc (YYYY-MM-DD)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    const result = await createTrip({
      destination: destination.trim(),
      startDate,
      endDate,
      budget: budget ? parseInt(budget.replace(/[^\d]/g, ''), 10) : 0,
      people: parseInt(people, 10) || 1,
      travelStyle,
      interests: interests.trim(),
      hotelArea: hotelArea.trim(),
      generateAiItinerary: generateAI,
    });

    if (result.success) {
      navigation.replace('TripDetail', { tripId: result.data._id });
    } else {
      Alert.alert('Lỗi', result.message || 'Không thể tạo chuyến đi');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Tạo chuyến đi mới"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* AI Toggle */}
        <View style={styles.aiCard}>
          <View style={styles.aiLeft}>
            <View style={styles.aiIcon}>
              <Ionicons name="sparkles" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.aiTitle}>AI Lập lịch trình</Text>
              <Text style={styles.aiSub}>Để AI tạo lịch trình chi tiết cho bạn</Text>
            </View>
          </View>
          <Switch
            value={generateAI}
            onValueChange={setGenerateAI}
            trackColor={{ false: COLORS.gray[200], true: COLORS.primaryLight }}
            thumbColor={generateAI ? COLORS.primary : COLORS.gray[400]}
          />
        </View>

        {/* Required fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chuyến đi</Text>

          <CustomInput
            label="Điểm đến *"
            value={destination}
            onChangeText={(t) => { setDestination(t); setErrors((e) => ({ ...e, destination: '' })); }}
            placeholder="VD: Đà Nẵng, Hà Nội..."
            error={errors.destination}
            leftIcon={<Ionicons name="location-outline" size={18} color={COLORS.gray[400]} />}
          />
          <CustomInput
            label="Ngày bắt đầu *"
            value={startDate}
            onChangeText={(t) => { setStartDate(t); setErrors((e) => ({ ...e, startDate: '' })); }}
            placeholder="2026-06-01"
            error={errors.startDate}
            leftIcon={<Ionicons name="calendar-outline" size={18} color={COLORS.gray[400]} />}
          />
          <CustomInput
            label="Ngày kết thúc *"
            value={endDate}
            onChangeText={(t) => { setEndDate(t); setErrors((e) => ({ ...e, endDate: '' })); }}
            placeholder="2026-06-03"
            error={errors.endDate}
            leftIcon={<Ionicons name="calendar-outline" size={18} color={COLORS.gray[400]} />}
          />
          <CustomInput
            label="Ngân sách (VND)"
            value={budget}
            onChangeText={setBudget}
            placeholder="5000000"
            keyboardType="numeric"
            leftIcon={<Ionicons name="wallet-outline" size={18} color={COLORS.gray[400]} />}
          />
          <CustomInput
            label="Số người"
            value={people}
            onChangeText={setPeople}
            placeholder="2"
            keyboardType="numeric"
            leftIcon={<Ionicons name="people-outline" size={18} color={COLORS.gray[400]} />}
          />
        </View>

        {/* Travel style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phong cách du lịch</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleRow}>
            {TRAVEL_STYLES.map((style) => (
              <TouchableOpacity
                key={style.value}
                style={[
                  styles.styleChip,
                  travelStyle === style.value && styles.styleChipActive,
                ]}
                onPress={() => setTravelStyle(style.value)}
              >
                <Text
                  style={[
                    styles.styleChipText,
                    travelStyle === style.value && styles.styleChipTextActive,
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AI extra fields */}
        {generateAI && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thêm thông tin cho AI</Text>
            <CustomInput
              label="Sở thích"
              value={interests}
              onChangeText={setInterests}
              placeholder="Bãi biển, ẩm thực, văn hóa..."
              leftIcon={<Ionicons name="heart-outline" size={18} color={COLORS.gray[400]} />}
            />
            <CustomInput
              label="Khu vực ở (khách sạn)"
              value={hotelArea}
              onChangeText={setHotelArea}
              placeholder="Gần bãi biển, trung tâm..."
              leftIcon={<Ionicons name="bed-outline" size={18} color={COLORS.gray[400]} />}
            />
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <CustomButton
          title={isCreating ? 'Đang tạo...' : generateAI ? '✨ Tạo với AI' : 'Tạo chuyến đi'}
          onPress={handleCreate}
          loading={isCreating}
          size="lg"
        />
        {isCreating && (
          <Text style={styles.aiWait}>AI đang lập lịch trình, vui lòng đợi...</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    padding: SPACING.md,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  aiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
  aiSub: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  styleRow: {
    flexDirection: 'row',
  },
  styleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    marginRight: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  styleChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  styleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  styleChipTextActive: {
    color: COLORS.white,
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  aiWait: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default CreateTripScreen;
