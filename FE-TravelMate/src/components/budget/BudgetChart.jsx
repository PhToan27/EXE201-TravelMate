import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { formatVND } from '../../utils/currencyUtils';

const { width } = Dimensions.get('window');

const BudgetChart = ({ chartData = [], totalBudget = 0, totalExpenses = 0 }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu</Text>
      </View>
    );
  }

  const remaining = totalBudget - totalExpenses;
  const usedPercent = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Budget summary */}
      <View style={styles.summary}>
        <SummaryItem label="Ngân sách" value={formatVND(totalBudget)} color={COLORS.gray[700]} />
        <View style={styles.divider} />
        <SummaryItem label="Đã chi" value={formatVND(totalExpenses)} color={COLORS.primary} />
        <View style={styles.divider} />
        <SummaryItem
          label="Còn lại"
          value={formatVND(remaining)}
          color={remaining < 0 ? COLORS.error : COLORS.success}
        />
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(usedPercent, 100)}%`,
                backgroundColor: usedPercent > 100 ? COLORS.error : COLORS.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>{usedPercent}% đã sử dụng</Text>
      </View>

      {/* Pie chart */}
      <PieChart
        data={chartData}
        width={width - SPACING.md * 4}
        height={180}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        hasLegend={true}
      />
    </View>
  );
};

const SummaryItem = ({ label, value, color }) => (
  <View style={styles.summaryItem}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { gap: SPACING.md },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[400],
    fontStyle: 'italic',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: SPACING.sm,
  },
  progressWrap: {
    gap: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'right',
  },
});

export default BudgetChart;
