import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import BudgetChart from '../../components/budget/BudgetChart';
import BudgetItem from '../../components/budget/BudgetItem';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import useTrip from '../../hooks/useTrip';
import useBudget from '../../hooks/useBudget';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { formatVND } from '../../utils/currencyUtils';

const BudgetBreakdownScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;
  const { currentTrip: trip, isLoading, fetchTripById } = useTrip();
  const { stats, chartData, aiBreakdown } = useBudget(trip);

  useEffect(() => {
    fetchTripById(tripId);
  }, [tripId]);

  if (isLoading || !trip) return <Loading message="Đang tải ngân sách..." />;

  return (
    <View style={styles.container}>
      <Header
        title="Phân tích ngân sách"
        subtitle={trip.destination}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main chart */}
        <BudgetChart
          chartData={chartData}
          totalBudget={trip.budget}
          totalExpenses={stats?.totalExpenses || 0}
        />

        {/* Activity breakdown */}
        {chartData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chi tiết theo danh mục</Text>
            {chartData.map((item) => (
              <BudgetItem
                key={item.name}
                label={item.name}
                amount={item.amount}
                total={stats?.totalExpenses || 1}
                color={item.color}
              />
            ))}
          </View>
        )}

        {/* AI budget allocation */}
        {aiBreakdown.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✨ Phân bổ AI gợi ý</Text>
            {aiBreakdown.map((item) => (
              <BudgetItem
                key={item.label}
                label={item.label}
                amount={item.amount}
                total={trip.budget || 1}
                color={item.color}
              />
            ))}
          </View>
        )}

        {chartData.length === 0 && aiBreakdown.length === 0 && (
          <EmptyState
            icon="wallet-outline"
            title="Chưa có dữ liệu chi tiêu"
            subtitle="Thêm hoạt động vào lịch trình để theo dõi ngân sách"
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, gap: SPACING.md },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
});

export default BudgetBreakdownScreen;
