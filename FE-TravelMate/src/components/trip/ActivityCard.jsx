import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, ACTIVITY_CATEGORIES, TRANSPORT_TYPES } from '../../utils/constants';
import { formatVND } from '../../utils/currencyUtils';

/**
 * ActivityCard — single activity item in the timeline
 */
const ActivityCard = ({ activity, isLast = false }) => {
  const cat = ACTIVITY_CATEGORIES[activity.category] || ACTIVITY_CATEGORIES.OTHER;
  const transport = activity.transport ? TRANSPORT_TYPES[activity.transport] : null;

  return (
    <View style={styles.row}>
      {/* Timeline line */}
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: cat.color }]} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Content card */}
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.catBadge, { backgroundColor: cat.color + '20' }]}>
            <Ionicons name={cat.icon} size={12} color={cat.color} />
            <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          {activity.time && (
            <View style={styles.timeChip}>
              <Ionicons name="time-outline" size={11} color={COLORS.gray[500]} />
              <Text style={styles.time}>{activity.time}</Text>
            </View>
          )}
        </View>

        <Text style={styles.location} numberOfLines={2}>{activity.location}</Text>
        {!!activity.description && (
          <Text style={styles.description} numberOfLines={3}>{activity.description}</Text>
        )}

        <View style={styles.footer}>
          {transport && (
            <View style={styles.transportChip}>
              <Ionicons name={transport.icon} size={12} color={COLORS.gray[500]} />
              <Text style={styles.transportText}>{transport.label}</Text>
            </View>
          )}
          {activity.durationMinutes > 0 && (
            <Text style={styles.duration}>{activity.durationMinutes} phút</Text>
          )}
          {activity.cost > 0 && (
            <Text style={styles.cost}>{formatVND(activity.cost)}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  timeline: {
    alignItems: 'center',
    width: 24,
    marginTop: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  line: {
    flex: 1,
    width: 1.5,
    backgroundColor: COLORS.gray[200],
    marginTop: 4,
    marginBottom: -4,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  time: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
  location: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 18,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  transportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  transportText: {
    fontSize: 11,
    color: COLORS.gray[600],
  },
  duration: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
  cost: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default ActivityCard;
