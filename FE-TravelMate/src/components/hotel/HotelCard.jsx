import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { formatVND } from '../../utils/currencyUtils';

const HotelCard = ({ hotel }) => {
  if (!hotel) return null;

  const stars = Math.round(hotel.rating || 0);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="bed-outline" size={32} color={COLORS.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{hotel.name}</Text>
        {!!hotel.area && (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={13} color={COLORS.gray[500]} />
            <Text style={styles.area}>{hotel.area}</Text>
          </View>
        )}
        {!!hotel.address && (
          <Text style={styles.address} numberOfLines={2}>{hotel.address}</Text>
        )}
        {stars > 0 && (
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < stars ? 'star' : 'star-outline'}
                size={14}
                color={i < stars ? '#F59E0B' : COLORS.gray[300]}
              />
            ))}
          </View>
        )}
        {!!hotel.description && (
          <Text style={styles.description} numberOfLines={3}>{hotel.description}</Text>
        )}
        {hotel.estimatedCostPerNight > 0 && (
          <Text style={styles.price}>
            {formatVND(hotel.estimatedCostPerNight)}{' '}
            <Text style={styles.perNight}>/đêm</Text>
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  area: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  address: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  description: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 18,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  perNight: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.gray[500],
  },
});

export default HotelCard;
