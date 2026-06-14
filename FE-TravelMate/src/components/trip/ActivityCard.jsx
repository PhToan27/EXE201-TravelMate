import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, ACTIVITY_CATEGORIES, TRANSPORT_TYPES } from '../../utils/constants';
import { formatVND } from '../../utils/currencyUtils';

const getTimePeriod = (timeStr) => {
  if (!timeStr) return 'HOẠT ĐỘNG';
  const time = timeStr.toUpperCase();
  let hour = 8;
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)?/);
  if (match) {
    hour = parseInt(match[1], 10);
    const ampm = match[3];
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  } else {
    const militaryMatch = time.match(/(\d+):(\d+)/);
    if (militaryMatch) {
      hour = parseInt(militaryMatch[1], 10);
    }
  }
  
  if (hour < 12) return 'BUỔI SÁNG';
  if (hour >= 12 && hour < 14) return 'BUỔI TRƯA';
  if (hour >= 14 && hour < 18) return 'BUỔI CHIỀU';
  return 'BUỔI TỐI';
};

const getVietMapVehicle = (transport) => {
  if (transport === 'WALKING') return 'foot';
  if (transport === 'BIKE') return 'bike';
  if (['CAR', 'TAXI', 'GRAB', 'BUS'].includes(transport)) return 'car';
  return 'motorcycle';
};

const ActivityCard = ({ activity, isLast = false }) => {
  const navigation = useNavigation();
  const cat = ACTIVITY_CATEGORIES[activity.category] || ACTIVITY_CATEGORIES.OTHER;
  const transport = activity.transport ? TRANSPORT_TYPES[activity.transport] : null;
  const timePeriod = getTimePeriod(activity.time);

  return (
    <View style={styles.container}>
      {/* Time Header Bar */}
      <View style={styles.timeHeader}>
        <View style={[styles.timeDot, { backgroundColor: cat.color }]} />
        <Text style={styles.timeText}>
          {activity.time || '08:00 AM'} <Text style={styles.timePeriodText}>• {timePeriod}</Text>
        </Text>
      </View>

      <View style={styles.bodyRow}>
        {/* Left timeline connector line */}
        <View style={styles.timelineCol}>
          {!isLast && <View style={styles.verticalLine} />}
        </View>

        {/* Content Card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => {
            if (activity._id && activity.location && activity.location !== 'N/A') {
              navigation.navigate('NavigationDetail', {
                placeId: activity._id,
                placeName: activity.location,
                vehicle: getVietMapVehicle(activity.transport),
              });
            }
          }}
        >
          <View style={styles.topRow}>
            {/* Category badge */}
            <View style={[styles.catBadge, { backgroundColor: cat.color + '15' }]}>
              <Ionicons name={cat.icon} size={11} color={cat.color} />
              <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
            </View>
          </View>

          {/* Activity title */}
          <Text style={styles.title} numberOfLines={2}>
            {activity.location || 'N/A'}
          </Text>

          {/* Description */}
          {!!activity.description && (
            <Text style={styles.description} numberOfLines={4}>
              {activity.description}
            </Text>
          )}

          {/* Footer details */}
          <View style={styles.footer}>
            {/* Transport type */}
            {transport && (
              <View style={styles.transportChip}>
                <Ionicons name={transport.icon} size={12} color={COLORS.gray[500]} />
                <Text style={styles.transportText}>{transport.label}</Text>
              </View>
            )}

            {/* Duration */}
            {activity.durationMinutes > 0 && (
              <View style={styles.detailChip}>
                <Ionicons name="time-outline" size={11} color={COLORS.gray[400]} />
                <Text style={styles.detailText}>{activity.durationMinutes} phút</Text>
              </View>
            )}

            {/* Cost */}
            {activity.cost > 0 && (
              <Text style={styles.cost}>{formatVND(activity.cost)}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 6,
    marginBottom: 6,
  },
  timeDot: {
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
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray[800],
  },
  timePeriodText: {
    color: COLORS.gray[400],
    fontSize: 11,
    fontWeight: '600',
  },
  bodyRow: {
    flexDirection: 'row',
  },
  timelineCol: {
    width: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.gray[200],
    marginTop: -4,
    marginBottom: -16, // Connect to next item's dot
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginLeft: SPACING.sm,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  catText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: COLORS.gray[500],
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[50],
    paddingTop: 8,
    flexWrap: 'wrap',
  },
  transportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  transportText: {
    fontSize: 11,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  detailText: {
    fontSize: 11,
    color: COLORS.gray[400],
    fontWeight: '600',
  },
  cost: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
});

export default ActivityCard;
