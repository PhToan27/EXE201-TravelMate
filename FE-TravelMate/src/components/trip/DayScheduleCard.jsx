import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, ACTIVITY_CATEGORIES } from '../../utils/constants';
import ActivityCard from './ActivityCard';

/**
 * DayScheduleCard — shows all activities for a single day
 */
const DayScheduleCard = ({ day, activities = [], date }) => {
  return (
    <View style={styles.container}>
      {/* Day header */}
      <View style={styles.header}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayNum}>{day}</Text>
        </View>
        <View>
          <Text style={styles.dayTitle}>Ngày {day}</Text>
          {date && <Text style={styles.date}>{date}</Text>}
        </View>
      </View>

      {/* Activities */}
      {activities.length === 0 ? (
        <Text style={styles.empty}>Chưa có hoạt động</Text>
      ) : (
        activities.map((activity, idx) => (
          <ActivityCard
            key={idx}
            activity={activity}
            isLast={idx === activities.length - 1}
          />
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNum: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  date: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  empty: {
    fontSize: 13,
    color: COLORS.gray[400],
    fontStyle: 'italic',
    paddingLeft: SPACING.lg,
  },
});

export default DayScheduleCard;
