import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import DayScheduleCard from './DayScheduleCard';
import { formatDate } from '../../utils/dateUtils';
import { addDays, parseISO } from 'date-fns';

const VI_DAYS = {
  'Mon': 'Thứ Hai',
  'Tue': 'Thứ Ba',
  'Wed': 'Thứ Tư',
  'Thu': 'Thứ Năm',
  'Fri': 'Thứ Sáu',
  'Sat': 'Thứ Bảy',
  'Sun': 'Chủ Nhật',
};

const formatDayName = (dateObj) => {
  const enDay = formatDate(dateObj, 'EEE');
  return VI_DAYS[enDay] || enDay;
};

const TripTimeline = ({ trip, tripId }) => {
  const [selectedDay, setSelectedDay] = useState(1);
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
      {/* Day Selection Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {days.map((day) => {
          const dateObj = startDate
            ? addDays(parseISO(typeof startDate === 'string' ? startDate : startDate.toISOString()), day - 1)
            : null;
          
          const dayName = dateObj ? formatDayName(dateObj) : `Ngày ${day}`;
          const isSelected = selectedDay === day;

          return (
            <TouchableOpacity
              key={day}
              style={[styles.tab, isSelected && styles.tabActive]}
              onPress={() => setSelectedDay(day)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                Ngày {day}
              </Text>
              <Text style={[styles.dayNameText, isSelected && styles.dayNameTextActive]}>
                {dayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected Day Timeline */}
      <View style={styles.timelineContent}>
        <DayScheduleCard
          day={selectedDay}
          activities={byDay[selectedDay] || []}
          tripId={tripId}
          date={
            startDate
              ? formatDate(addDays(parseISO(typeof startDate === 'string' ? startDate : startDate.toISOString()), selectedDay - 1), 'dd/MM/yyyy')
              : null
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: -SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    marginBottom: SPACING.md,
  },
  tabsContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: SPACING.md,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
    minWidth: 90,
  },
  tabActive: {
    backgroundColor: '#FFF7ED',
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  dayNameText: {
    fontSize: 10,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  dayNameTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  timelineContent: {
    paddingHorizontal: 4,
  },
});

export default TripTimeline;
