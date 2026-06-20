import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../utils/constants';
import ActivityCard from './ActivityCard';

/**
 * DayScheduleCard — shows all activities for a single day
 */
const DayScheduleCard = ({ day, activities = [], tripId }) => {
  return (
    <View style={styles.container}>
      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Chưa có hoạt động nào được lên kế hoạch.</Text>
        </View>
      ) : (
        activities.map((activity, idx) => (
          <ActivityCard
            key={idx}
            activity={activity}
            isLast={idx === activities.length - 1}
            tripId={tripId}
          />
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.md,
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  empty: {
    fontSize: 13,
    color: COLORS.gray[400],
    fontStyle: 'italic',
  },
});

export default DayScheduleCard;
