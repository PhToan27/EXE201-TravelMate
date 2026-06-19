import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { searchPlaces } from '../../services/place/placeApi';

const categories = [
  { label: 'Tất cả', value: '' },
  { label: 'Ăn uống', value: 'food' },
  { label: 'Biển', value: 'beach' },
  { label: 'Văn hóa', value: 'culture' },
  { label: 'Thiên nhiên', value: 'nature' },
];

const fallbackImage =
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80';

const getPlaceAddress = (place) => place?.address || place?.location || 'Đà Nẵng, Việt Nam';

const getPlaceTags = (place) =>
  [place?.category, place?.ticketPrice]
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 2);

const SearchPlacesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const response = await searchPlaces({
          q: query.trim(),
          category: activeCategory.value,
          limit: 100,
        });

        if (!isMounted) return;
        if (response.success) {
          setPlaces(response.data || []);
        } else {
          setErrorMessage(response.message || 'Không thể tìm kiếm địa điểm.');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || 'Không thể tìm kiếm địa điểm.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [activeCategory, query]);

  const handleOpenPlace = (place) => {
    navigation.navigate('PlaceDetail', {
      placeName: place.name,
      place,
      fromSearch: true,
    });
  };

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
          returnKeyType="search"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.gray[400]} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="options-outline" size={18} color={COLORS.gray[500]} />
        )}
      </View>

      <View style={styles.categories}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.label}
              style={[
                styles.categoryPill,
                activeCategory.label === category.label && styles.categoryPillActive,
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory.label === category.label && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Địa điểm gợi ý</Text>
          <Text style={styles.seeAll}>{places.length} kết quả</Text>
        </View>

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.stateText}>Đang tìm địa điểm phù hợp...</Text>
          </View>
        )}

        {!loading && !!errorMessage && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={28} color={COLORS.error} />
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        )}

        {!loading && !errorMessage && !places.length && (
          <View style={styles.stateBox}>
            <Ionicons name="search-outline" size={28} color={COLORS.gray[400]} />
            <Text style={styles.stateText}>Không có địa điểm phù hợp.</Text>
          </View>
        )}

        {!loading &&
          !errorMessage &&
          places.map((place) => {
            const tags = getPlaceTags(place);
            return (
              <TouchableOpacity
                key={place._id || place.id || place.name}
                style={styles.placeCard}
                activeOpacity={0.9}
                onPress={() => handleOpenPlace(place)}
              >
                <Image source={{ uri: place.imageUrl || fallbackImage }} style={styles.placeImage} />
                <View style={styles.placeBody}>
                  <View style={styles.placeTitleRow}>
                    <Text style={styles.placeName} numberOfLines={2}>
                      {place.name}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={13} color={COLORS.warning} />
                      <Text style={styles.ratingText}>{place.rating || '4.5'}</Text>
                    </View>
                  </View>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color={COLORS.gray[400]} />
                    <Text style={styles.locationText} numberOfLines={2}>
                      {getPlaceAddress(place)}
                    </Text>
                  </View>
                  {!!tags.length && (
                    <View style={styles.tags}>
                      {tags.map((tag) => (
                        <Text key={tag} style={styles.tag} numberOfLines={1}>
                          {tag}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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
    paddingVertical: SPACING.md,
  },
  categoryScroll: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
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
  stateBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  stateText: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    fontWeight: '600',
  },
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
  placeBody: { padding: SPACING.sm },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  placeName: { flex: 1, fontSize: 15, fontWeight: '800', color: COLORS.black },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText: { fontSize: 12, color: COLORS.gray[600], fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 4 },
  locationText: { flex: 1, fontSize: 11, color: COLORS.gray[500], lineHeight: 16 },
  tags: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  tag: {
    maxWidth: '48%',
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
