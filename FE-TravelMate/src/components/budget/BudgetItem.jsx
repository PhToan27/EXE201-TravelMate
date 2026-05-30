import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { formatVND, calcPercent } from '../../utils/currencyUtils';

const BudgetItem = ({ label, amount, total, color = COLORS.primary }) => {
  const percent = calcPercent(amount, total);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatVND(amount)}</Text>
          <Text style={styles.percent}>{percent}%</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },
  percent: {
    fontSize: 12,
    color: COLORS.gray[500],
    width: 36,
    textAlign: 'right',
  },
  track: {
    height: 6,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});

export default BudgetItem;
