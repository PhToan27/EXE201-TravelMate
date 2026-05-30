import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, TRIP_STATUS } from '../../utils/constants';
import { formatDateRange, getDayCount, getTripTimeLabel } from '../../utils/dateUtils';
import { formatCompact } from '../../utils/currencyUtils';

const TripCard = ({ trip, onPress, onDelete }) => {
  const status = TRIP_STATUS[trip.status] || TRIP_STATUS.SAVED;
  const timeLabel = getTripTimeLabel(trip.startDate, trip.endDate);
  const dayCount = getDayCount(trip.startDate, trip.endDate);

  const gradients = [
    ['#F97316', '#FB923C'],
    ['#3B82F6', '#60A5FA'],
    ['#8B5CF6', '#A78BFA'],
    ['#10B981', '#34D399'],
    ['#EC4899', '#F472B6'],
  ];
  const gradient = gradients[trip.destination?.length % gradients.length] || gradients[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Gradient header */}
      <LinearGradient colors={gradient} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerTop}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{status.label}</Text>
          </View>
          {onDelete && (
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.destRow}>
          <Ionicons name="location" size={20} color="rgba(255,255,255,0.9)" />
          <Text style={styles.destination} numberOfLines={1}>{trip.destination}</Text>
        </View>
        <Text style={styles.timeLabel}>{timeLabel}</Text>
      </LinearGradient>

      {/* Info section */}
      <View style={styles.body}>
        <View style={styles.infoRow}>
          <InfoChip icon="calendar-outline" label={formatDateRange(trip.startDate, trip.endDate)} />
          <InfoChip icon="sunny-outline" label={`${dayCount} ngày`} />
          <InfoChip icon="people-outline" label={`${trip.totalPeople || 1} người`} />
        </View>

        <View style={styles.divider} />

        <View style={styles.budgetRow}>
          <View>
            <Text style={styles.budgetLabel}>Ngân sách</Text>
            <Text style={styles.budgetValue}>{formatCompact(trip.budget)} ₫</Text>
          </View>
          {trip.budgetStats && (
            <View style={styles.budgetStats}>
              <Text style={styles.usedLabel}>Đã dùng</Text>
              <Text style={[styles.usedValue, { color: trip.budgetStats.remainingBudget < 0 ? COLORS.error : COLORS.success }]}>
                {formatCompact(trip.budgetStats.totalExpenses)} ₫
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const InfoChip = ({ icon, label }) => (
  <View style={chipStyles.chip}>
    <Ionicons name={icon} size={13} color={COLORS.gray[500]} />
    <Text style={chipStyles.label}>{label}</Text>
  </View>
);

const chipStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  label: { fontSize: 12, color: COLORS.gray[500] },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '600',
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  destination: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  body: {
    padding: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginVertical: SPACING.sm,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  budgetStats: {
    alignItems: 'center',
  },
  usedLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
  usedValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TripCard;
