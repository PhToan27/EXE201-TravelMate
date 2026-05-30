import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { formatVND } from '../../utils/currencyUtils';

const RestaurantCard = ({ restaurant }) => {
  if (!restaurant) return null;

  const stars = Math.round(restaurant.rating || 0);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="restaurant-outline" size={28} color={COLORS.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{restaurant.name}</Text>
        {!!restaurant.cuisineType && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{restaurant.cuisineType}</Text>
          </View>
        )}
        {!!restaurant.address && (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={12} color={COLORS.gray[500]} />
            <Text style={styles.address} numberOfLines={1}>{restaurant.address}</Text>
          </View>
        )}
        {stars > 0 && (
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < stars ? 'star' : 'star-outline'}
                size={13}
                color={i < stars ? '#F59E0B' : COLORS.gray[300]}
              />
            ))}
          </View>
        )}
        {!!restaurant.description && (
          <Text style={styles.description} numberOfLines={2}>{restaurant.description}</Text>
        )}
        {restaurant.averagePricePerPerson > 0 && (
          <Text style={styles.price}>
            ~{formatVND(restaurant.averagePricePerPerson)}{' '}
            <Text style={styles.perPerson}>/người</Text>
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
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  typeText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  address: { fontSize: 11, color: COLORS.gray[500], flex: 1 },
  stars: { flexDirection: 'row', gap: 2 },
  description: { fontSize: 12, color: COLORS.gray[600], lineHeight: 17 },
  price: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  perPerson: { fontSize: 11, fontWeight: '400', color: COLORS.gray[500] },
});

export default RestaurantCard;
