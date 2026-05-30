import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SPACING } from '../../utils/constants';
import DayScheduleCard from './DayScheduleCard';
import { formatDate } from '../../utils/dateUtils';
import { addDays, parseISO } from 'date-fns';

/**
 * TripTimeline — renders all days with their activities grouped by day number
 */
const TripTimeline = ({ trip }) => {
  if (!trip) return null;

  const { activities = [], startDate, totalDays = 1 } = trip;

  // Group activities by day
  const byDay = {};
  activities.forEach((act) => {
    const d = act.day || 1;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(act);
  });

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {days.map((day) => {
        const dayDate = startDate
          ? formatDate(addDays(parseISO(typeof startDate === 'string' ? startDate : startDate.toISOString()), day - 1), 'EEE, dd/MM')
          : null;

        return (
          <DayScheduleCard
            key={day}
            day={day}
            date={dayDate}
            activities={byDay[day] || []}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: SPACING.md,
  },
});

export default TripTimeline;
