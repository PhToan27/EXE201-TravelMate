import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TRANSPORT_TYPES } from '../../utils/constants';
import ActivityCard from './ActivityCard';

const formatTransitionTime = (minutes) => {
  if (!minutes) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
  }
  return `${mins}m`;
};

const TransitionCard = ({ activity }) => {
  const modeKey = activity.transport || 'OTHER';
  const mode = TRANSPORT_TYPES[modeKey] || TRANSPORT_TYPES.OTHER;
  
  // Custom colors for transport modes to match Edit screen
  const modeColors = {
    WALKING: '#10B981',
    BIKE: '#3B82F6',
    MOTORBIKE: '#F59E0B',
    CAR: '#EF4444',
    BUS: '#8B5CF6',
    TAXI: '#EC4899',
    GRAB: '#10B981',
    OTHER: '#6B7280',
  };
  const color = modeColors[modeKey] || '#6B7280';

  const timeText = activity.travelTimeMinutes ? formatTransitionTime(activity.travelTimeMinutes) : '';
  const distText = activity.travelDistanceKm ? `${activity.travelDistanceKm} km` : '';
  const label = [timeText, distText].filter(Boolean).join(' • ');

  return (
    <View style={styles.transitionWrapper}>
      <View style={styles.transitionLineContainer}>
        <View style={styles.transitionLine} />
      </View>
      <View style={styles.transitionCard}>
        <View style={[styles.transitionIconWrapper, { backgroundColor: `${color}15` }]}>
          <Ionicons name={mode.icon} size={13} color={color} />
        </View>
        <Text style={styles.transitionText}>
          {mode.label} {label ? `(${label})` : 'chưa có thông tin di chuyển'}
        </Text>
      </View>
    </View>
  );
};

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
        activities.map((activity, idx) => {
          const items = [];
          items.push(
            <ActivityCard
              key={activity._id || idx}
              activity={activity}
              isLast={idx === activities.length - 1}
              tripId={tripId}
            />
          );
          if (idx < activities.length - 1) {
            items.push(
              <TransitionCard
                key={`trans-${activity._id || idx}`}
                activity={activities[idx + 1]}
              />
            );
          }
          return items;
        })
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
  transitionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  transitionLineContainer: {
    width: 10,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionLine: {
    width: 2,
    height: 36,
    backgroundColor: COLORS.gray[200],
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  transitionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginLeft: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  transitionIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  transitionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
});

export default DayScheduleCard;
