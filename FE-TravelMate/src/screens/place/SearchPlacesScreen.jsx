import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../utils/constants';

const categories = ['Tất cả', 'Ẩm thực', 'Biển', 'Văn hóa'];

const places = [
  {
    name: 'Bán đảo Sơn Trà',
    location: 'Đà Nẵng, Việt Nam',
    rating: 4.8,
    category: 'Thiên nhiên',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
    tags: ['Thiên nhiên', 'Khám phá'],
  },
  {
    name: 'Chùa Cầu',
    location: 'Hội An, Quảng Nam',
    rating: 4.9,
    category: 'Văn hóa',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1000&q=80',
    tags: ['Kiến trúc', 'Lịch sử'],
  },
  {
    name: 'Chợ Đông Ba',
    location: 'Huế, Thừa Thiên Huế',
    rating: 4.5,
    category: 'Ẩm thực',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
    tags: ['Ẩm thực', 'Mua sắm'],
  },
];

const SearchPlacesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const filteredPlaces = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return places.filter((place) => {
      const matchesKeyword =
        !keyword ||
        place.name.toLowerCase().includes(keyword) ||
        place.location.toLowerCase().includes(keyword);
      const matchesCategory = activeCategory === 'Tất cả' || place.category === activeCategory;
      return matchesKeyword && matchesCategory;
    });
  }, [activeCategory, query]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm kiếm</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray[400]} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          placeholder="Tìm địa điểm du lịch"
          placeholderTextColor={COLORS.gray[400]}
        />
        <Ionicons name="options-outline" size={18} color={COLORS.gray[500]} />
      </View>

      <View style={styles.categories}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryPill, activeCategory === category && styles.categoryPillActive]}
            onPress={() => setActiveCategory(category)}
          >
            <Text style={[styles.categoryText, activeCategory === category && styles.categoryTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Địa điểm nổi tiếng</Text>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </View>

        {filteredPlaces.map((place) => (
          <TouchableOpacity
            key={place.name}
            style={styles.placeCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('PlaceDetail', { placeName: place.name })}
          >
            <Image source={{ uri: place.imageUrl }} style={styles.placeImage} />
            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons name="heart-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.placeBody}>
              <View style={styles.placeTitleRow}>
                <Text style={styles.placeName}>{place.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color={COLORS.warning} />
                  <Text style={styles.ratingText}>{place.rating}</Text>
                </View>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={COLORS.gray[400]} />
                <Text style={styles.locationText}>{place.location}</Text>
              </View>
              <View style={styles.tags}>
                {place.tags.map((tag) => (
                  <Text key={tag} style={styles.tag}>{tag}</Text>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  backButton: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  searchRow: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.black },
  categories: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  categoryPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.white,
  },
  categoryPillActive: { backgroundColor: COLORS.primary },
  categoryText: { fontSize: 12, color: COLORS.gray[500], fontWeight: '700' },
  categoryTextActive: { color: COLORS.white },
  content: { paddingHorizontal: SPACING.md, gap: SPACING.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  seeAll: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  placeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  placeImage: { width: '100%', height: 180, backgroundColor: COLORS.gray[100] },
  favoriteButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBody: { padding: SPACING.sm },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  placeName: { flex: 1, fontSize: 15, fontWeight: '800', color: COLORS.black },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, color: COLORS.gray[600], fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 11, color: COLORS.gray[500] },
  tags: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  tag: {
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
});

export default SearchPlacesScreen;
