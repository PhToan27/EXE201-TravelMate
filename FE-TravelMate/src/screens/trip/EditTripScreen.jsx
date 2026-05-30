import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import Loading from '../../components/common/Loading';
import useTrip from '../../hooks/useTrip';
import { COLORS, SPACING } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';

const EditTripScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;
  const { currentTrip: trip, isLoading, fetchTripById, updateTrip } = useTrip();

  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [people, setPeople] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTripById(tripId);
  }, [tripId]);

  useEffect(() => {
    if (trip) {
      setDestination(trip.destination || '');
      setBudget(String(trip.budget || ''));
      setPeople(String(trip.totalPeople || 1));
    }
  }, [trip]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateTrip(tripId, {
      destination,
      budget: parseInt(budget, 10) || 0,
      totalPeople: parseInt(people, 10) || 1,
    });
    setSaving(false);
    if (result.success) {
      navigation.goBack();
    } else {
      Alert.alert('Lỗi', result.message || 'Không thể cập nhật');
    }
  };

  if (isLoading || !trip) return <Loading />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Chỉnh sửa chuyến đi" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <CustomInput
          label="Điểm đến"
          value={destination}
          onChangeText={setDestination}
          leftIcon={<Ionicons name="location-outline" size={18} color={COLORS.gray[400]} />}
        />
        <CustomInput
          label="Ngân sách (VND)"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
          leftIcon={<Ionicons name="wallet-outline" size={18} color={COLORS.gray[400]} />}
        />
        <CustomInput
          label="Số người"
          value={people}
          onChangeText={setPeople}
          keyboardType="numeric"
          leftIcon={<Ionicons name="people-outline" size={18} color={COLORS.gray[400]} />}
        />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <CustomButton title="Lưu thay đổi" onPress={handleSave} loading={saving} size="lg" />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md },
  bottomBar: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
});

export default EditTripScreen;
