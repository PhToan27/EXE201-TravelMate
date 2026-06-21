import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../../components/common/Header';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import useTrip from '../../hooks/useTrip';
import { createExpense, deleteExpense, getTripExpenses, updateExpense } from '../../services/expense/expenseApi';
import { COLORS, RADIUS, SPACING } from '../../utils/constants';
import { formatVND, parseVND } from '../../utils/currencyUtils';
import { formatDateRange } from '../../utils/dateUtils';

const EXPENSE_CATEGORIES = [
  { key: 'FOOD', label: 'Ăn uống', icon: 'restaurant-outline', color: '#F59E0B' },
  { key: 'STAY', label: 'Nơi ở', icon: 'bed-outline', color: '#8B5CF6' },
  { key: 'TRANSPORT', label: 'Di chuyển', icon: 'car-outline', color: '#10B981' },
  { key: 'VISIT', label: 'Tham quan', icon: 'ticket-outline', color: '#3B82F6' },
  { key: 'SHOPPING', label: 'Mua sắm', icon: 'bag-outline', color: '#EC4899' },
  { key: 'OTHER', label: 'Phát sinh', icon: 'ellipsis-horizontal', color: '#94A3B8' },
];

const emptyForm = {
  title: '',
  amount: '',
  category: 'FOOD',
  paidAt: new Date().toISOString().slice(0, 10),
  note: '',
  bill: null,
};

const getCategoryMeta = (key) => EXPENSE_CATEGORIES.find((item) => item.key === key) || EXPENSE_CATEGORIES[5];

const toFormDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const toBillFile = (asset) => ({
  uri: asset.uri,
  name: asset.fileName || `bill_${Date.now()}.jpg`,
  type: asset.mimeType || 'image/jpeg',
});

const ExpenseScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const initialTripId = route?.params?.tripId || '';
  const openedFromTrip = Boolean(initialTripId);
  const { trips, currentTrip, isLoading, fetchTrips, fetchTripById } = useTrip(true);

  const [selectedTripId, setSelectedTripId] = useState(initialTripId);
  const [expenses, setExpenses] = useState([]);
  const [plannedExpenses, setPlannedExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find((trip) => trip._id === selectedTripId) || (currentTrip?._id === selectedTripId ? currentTrip : null);
  }, [selectedTripId, trips, currentTrip]);

  useEffect(() => {
    if (initialTripId) setSelectedTripId(initialTripId);
  }, [initialTripId]);

  useEffect(() => {
    if (!selectedTripId) return;
    fetchTripById(selectedTripId);
    loadExpenses(selectedTripId);
  }, [selectedTripId]);

  const loadExpenses = async (tripId = selectedTripId) => {
    if (!tripId) return;
    try {
      setLoadingExpenses(true);
      const res = await getTripExpenses(tripId);
      if (res.success) {
        setExpenses(res.data || []);
        setPlannedExpenses(res.plannedExpenses || []);
        setSummary(res.summary || null);
      }
    } catch (error) {
      Alert.alert('Không thể tải chi phí', error.response?.data?.message || error.message);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const openCreateModal = () => {
    setEditingExpense(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title || '',
      amount: String(expense.amount || ''),
      category: expense.category || 'OTHER',
      paidAt: toFormDate(expense.paidAt),
      note: expense.note || '',
      bill: null,
    });
    setModalVisible(true);
  };

  const pickBillFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập ảnh', 'Bạn cần cho phép truy cập thư viện ảnh để tải bill lên.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setForm((current) => ({ ...current, bill: toBillFile(result.assets[0]) }));
    }
  };

  const takeBillPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền camera', 'Bạn cần cho phép camera để chụp bill.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setForm((current) => ({ ...current, bill: toBillFile(result.assets[0]) }));
    }
  };

  const saveExpense = async () => {
    const amount = parseVND(form.amount);
    if (!form.title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên khoản chi.');
      return;
    }
    if (!amount) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }

    const paidDate = new Date(`${form.paidAt || emptyForm.paidAt}T12:00:00`);
    if (Number.isNaN(paidDate.getTime())) {
      Alert.alert('Ngày chưa đúng', 'Vui lòng nhập ngày theo dạng YYYY-MM-DD.');
      return;
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      amount,
      paidAt: paidDate.toISOString(),
    };

    try {
      setSaving(true);
      const res = editingExpense
        ? await updateExpense(editingExpense._id, payload)
        : await createExpense(selectedTripId, payload);

      if (res.success) {
        setModalVisible(false);
        await loadExpenses();
        Alert.alert('Thành công', editingExpense ? 'Đã cập nhật khoản chi.' : 'Đã thêm khoản chi.');
      } else {
        Alert.alert('Không thể lưu', res.message || 'Vui lòng thử lại.');
      }
    } catch (error) {
      Alert.alert('Không thể lưu', error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (expense) => {
    Alert.alert('Xóa khoản chi', `Bạn muốn xóa "${expense.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await deleteExpense(expense._id);
            if (res.success) {
              await loadExpenses();
            }
          } catch (error) {
            Alert.alert('Không thể xóa', error.response?.data?.message || error.message);
          }
        },
      },
    ]);
  };

  const goBack = () => {
    if (openedFromTrip) {
      navigation.goBack();
      return;
    }
    setSelectedTripId('');
    setExpenses([]);
    setPlannedExpenses([]);
    setSummary(null);
    fetchTrips();
  };

  if (!selectedTripId) {
    return (
      <View style={styles.container}>
        <Header title="Chi phí" />
        {isLoading ? (
          <Loading message="Đang tải chuyến đi..." />
        ) : trips.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="Chưa có chuyến đi"
            subtitle="Tạo chuyến đi trước để theo dõi chi phí ăn uống, nơi ở và bill."
          />
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.lg }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Chọn chuyến đi để quản lý chi phí</Text>
            {trips.map((trip) => (
              <TouchableOpacity
                key={trip._id}
                style={styles.tripCard}
                onPress={() => setSelectedTripId(trip._id)}
                activeOpacity={0.85}
              >
                <View style={styles.tripIcon}>
                  <Ionicons name="wallet-outline" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.tripBody}>
                  <Text style={styles.tripTitle}>{trip.destination}</Text>
                  <Text style={styles.tripSubtitle}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
                </View>
                <Text style={styles.tripBudget}>{formatVND(trip.budget || 0)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  if (!selectedTrip && isLoading) {
    return <Loading message="Đang tải chuyến đi..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Chi phí"
        subtitle={selectedTrip?.destination || ''}
        onBack={goBack}
        rightComponent={
          <TouchableOpacity style={styles.headerAction} onPress={openCreateModal}>
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      {loadingExpenses ? (
        <Loading message="Đang tải chi phí..." />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryLabel}>Dự kiến</Text>
              <Text style={styles.summaryValue}>{formatVND(summary?.plannedTotal || 0)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryLabel}>Bill đã nhập</Text>
              <Text style={styles.summaryValue}>{formatVND(summary?.totalSpent || 0)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryLabel}>Còn lại</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: (summary?.remainingBudget || 0) < 0 ? COLORS.error : COLORS.success },
                ]}
              >
                {formatVND(summary?.remainingBudget || 0)}
              </Text>
            </View>
          </View>

          <View style={styles.breakdownCard}>
            <Text style={styles.cardTitle}>Theo danh mục</Text>
            {(summary?.byCategory || []).length === 0 ? (
              <Text style={styles.mutedText}>Chưa có khoản chi nào.</Text>
            ) : (
              summary.byCategory.map((item) => {
                const meta = getCategoryMeta(item.key);
                return (
                  <View key={item.key} style={styles.breakdownRow}>
                    <View style={[styles.categoryDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={styles.breakdownValue}>{formatVND(item.amount)}</Text>
                  </View>
                );
              })
            )}
          </View>

          {plannedExpenses.length > 0 && (
            <View style={styles.plannedSection}>
              <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>Chi phí dự kiến từ lịch trình</Text>
                <Text style={styles.plannedTotal}>{formatVND(summary?.plannedTotal || 0)}</Text>
              </View>
              {plannedExpenses.map((expense) => (
                <PlannedExpenseItem key={expense._id} expense={expense} />
              ))}
            </View>
          )}

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Bill đã nhập</Text>
            <TouchableOpacity style={styles.smallAddButton} onPress={openCreateModal}>
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={styles.smallAddText}>Thêm</Text>
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="Chưa có chi phí"
              subtitle="Thêm chi phí thủ công hoặc chụp bill sau khi ăn uống, mua sắm."
            />
          ) : (
            expenses.map((expense) => (
              <ExpenseItem
                key={expense._id}
                expense={expense}
                onEdit={() => openEditModal(expense)}
                onDelete={() => confirmDelete(expense)}
              />
            ))
          )}
        </ScrollView>
      )}

      <ExpenseFormModal
        visible={modalVisible}
        form={form}
        setForm={setForm}
        editingExpense={editingExpense}
        saving={saving}
        onClose={() => setModalVisible(false)}
        onSave={saveExpense}
        onPickBill={pickBillFromLibrary}
        onTakeBill={takeBillPhoto}
      />
    </View>
  );
};

const PlannedExpenseItem = ({ expense }) => {
  const meta = getCategoryMeta(expense.category);
  return (
    <View style={[styles.expenseCard, styles.plannedCard]}>
      <View style={[styles.expenseIcon, { backgroundColor: `${meta.color}18` }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={styles.expenseBody}>
        <View style={styles.expenseTop}>
          <Text style={styles.expenseTitle}>{expense.title}</Text>
          <Text style={styles.expenseAmount}>{formatVND(expense.amount)}</Text>
        </View>
        <View style={styles.plannedMetaRow}>
          <Text style={styles.expenseMeta}>{expense.categoryLabel}</Text>
          <Text style={styles.plannedBadge}>Dự kiến</Text>
        </View>
        {!!expense.note && <Text style={styles.expenseNote}>{expense.note}</Text>}
      </View>
    </View>
  );
};

const ExpenseItem = ({ expense, onEdit, onDelete }) => {
  const meta = getCategoryMeta(expense.category);
  return (
    <View style={styles.expenseCard}>
      <View style={[styles.expenseIcon, { backgroundColor: `${meta.color}18` }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={styles.expenseBody}>
        <View style={styles.expenseTop}>
          <Text style={styles.expenseTitle}>{expense.title}</Text>
          <Text style={styles.expenseAmount}>{formatVND(expense.amount)}</Text>
        </View>
        <Text style={styles.expenseMeta}>
          {expense.categoryLabel} • {new Date(expense.paidAt).toLocaleDateString('vi-VN')}
        </Text>
        {!!expense.note && <Text style={styles.expenseNote}>{expense.note}</Text>}
        {!!expense.billImageUrl && (
          <View style={styles.billPreviewRow}>
            <Image source={{ uri: expense.billImageUrl }} style={styles.billThumb} />
            <Text style={styles.billText}>Đã lưu bill</Text>
          </View>
        )}
      </View>
      <View style={styles.expenseActions}>
        <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color={COLORS.gray[600]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ExpenseFormModal = ({
  visible,
  form,
  setForm,
  editingExpense,
  saving,
  onClose,
  onSave,
  onPickBill,
  onTakeBill,
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{editingExpense ? 'Sửa khoản chi' : 'Thêm khoản chi'}</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <FormInput
            label="Tên khoản chi"
            value={form.title}
            onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
            placeholder="Ví dụ: Hải sản Bé Mặn"
          />
          <View style={styles.formRow}>
            <FormInput
              label="Số tiền"
              value={form.amount}
              onChangeText={(value) => setForm((current) => ({ ...current, amount: value.replace(/[^\d]/g, '') }))}
              placeholder="250000"
              keyboardType="numeric"
              style={styles.formHalf}
            />
            <FormInput
              label="Ngày chi"
              value={form.paidAt}
              onChangeText={(value) => setForm((current) => ({ ...current, paidAt: value }))}
              placeholder="2026-06-21"
              style={styles.formHalf}
            />
          </View>

          <Text style={styles.formLabel}>Danh mục</Text>
          <View style={styles.categoryWrap}>
            {EXPENSE_CATEGORIES.map((category) => {
              const active = form.category === category.key;
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryChip,
                    active && { borderColor: category.color, backgroundColor: `${category.color}12` },
                  ]}
                  onPress={() => setForm((current) => ({ ...current, category: category.key }))}
                >
                  <Ionicons name={category.icon} size={14} color={active ? category.color : COLORS.gray[500]} />
                  <Text style={[styles.categoryText, active && { color: category.color }]}>{category.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FormInput
            label="Ghi chú"
            value={form.note}
            onChangeText={(value) => setForm((current) => ({ ...current, note: value }))}
            placeholder="Ví dụ: Ăn tối 2 người, đã thanh toán tiền mặt"
            multiline
            inputStyle={styles.noteInput}
          />

          <Text style={styles.formLabel}>Bill</Text>
          <View style={styles.billActions}>
            <TouchableOpacity style={styles.billAction} onPress={onTakeBill}>
              <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
              <Text style={styles.billActionText}>Chụp bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.billAction} onPress={onPickBill}>
              <Ionicons name="image-outline" size={18} color={COLORS.primary} />
              <Text style={styles.billActionText}>Chọn ảnh</Text>
            </TouchableOpacity>
          </View>
          {form.bill ? (
            <View style={styles.selectedBill}>
              <Image source={{ uri: form.bill.uri }} style={styles.selectedBillImage} />
              <Text style={styles.selectedBillText}>Bill mới đã chọn</Text>
            </View>
          ) : (
            <Text style={styles.billHint}>Bạn có thể nhập số tiền thủ công rồi chụp bill để lưu lại minh chứng.</Text>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Đang lưu...' : 'Lưu chi phí'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const FormInput = ({ label, style, inputStyle, ...props }) => (
  <View style={[styles.formGroup, style]}>
    <Text style={styles.formLabel}>{label}</Text>
    <TextInput {...props} placeholderTextColor={COLORS.gray[400]} style={[styles.formInput, inputStyle]} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, gap: SPACING.md },
  headerAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.black,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  tripIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripBody: { flex: 1 },
  tripTitle: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  tripSubtitle: { marginTop: 2, fontSize: 12, color: COLORS.gray[500] },
  tripBudget: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  summaryMetric: { flex: 1, minWidth: 0 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray[500] },
  summaryValue: { marginTop: 4, fontSize: 16, fontWeight: '900', color: COLORS.black },
  summaryDivider: { width: 1, backgroundColor: COLORS.gray[100], marginHorizontal: SPACING.xs },
  breakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.black, marginBottom: SPACING.sm },
  mutedText: { fontSize: 13, color: COLORS.gray[500] },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.sm },
  breakdownLabel: { flex: 1, fontSize: 13, color: COLORS.gray[700], fontWeight: '700' },
  breakdownValue: { fontSize: 13, color: COLORS.black, fontWeight: '800' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plannedSection: { gap: SPACING.sm },
  plannedTotal: { fontSize: 13, fontWeight: '900', color: COLORS.primary },
  smallAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
  },
  smallAddText: { fontSize: 12, color: COLORS.white, fontWeight: '800' },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  plannedCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  expenseIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseBody: { flex: 1 },
  expenseTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACING.sm },
  expenseTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: COLORS.black },
  expenseAmount: { fontSize: 14, fontWeight: '900', color: COLORS.primary },
  expenseMeta: { marginTop: 3, fontSize: 12, color: COLORS.gray[500] },
  plannedMetaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: 3 },
  plannedBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  expenseNote: { marginTop: 4, fontSize: 12, color: COLORS.gray[600], lineHeight: 17 },
  billPreviewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: SPACING.sm },
  billThumb: { width: 34, height: 34, borderRadius: RADIUS.sm, backgroundColor: COLORS.gray[100] },
  billText: { fontSize: 12, color: COLORS.success, fontWeight: '700' },
  expenseActions: { gap: SPACING.xs },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[50],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.black },
  formGroup: { marginBottom: SPACING.md },
  formLabel: { fontSize: 12, color: COLORS.gray[600], fontWeight: '800', marginBottom: 7 },
  formInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    color: COLORS.black,
    fontWeight: '700',
  },
  formRow: { flexDirection: 'row', gap: SPACING.sm },
  formHalf: { flex: 1 },
  noteInput: { minHeight: 78, textAlignVertical: 'top', paddingTop: SPACING.sm },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
  },
  categoryText: { fontSize: 12, color: COLORS.gray[600], fontWeight: '800' },
  billActions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  billAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    backgroundColor: '#FFF7ED',
  },
  billActionText: { fontSize: 13, color: COLORS.primary, fontWeight: '800' },
  billHint: { fontSize: 12, color: COLORS.gray[500], lineHeight: 18, marginBottom: SPACING.md },
  selectedBill: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  selectedBillImage: { width: 48, height: 48, borderRadius: RADIUS.sm, backgroundColor: COLORS.gray[100] },
  selectedBillText: { fontSize: 13, color: COLORS.success, fontWeight: '800' },
  saveButton: {
    marginTop: SPACING.sm,
    minHeight: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { opacity: 0.65 },
  saveButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '900' },
});

export default ExpenseScreen;
