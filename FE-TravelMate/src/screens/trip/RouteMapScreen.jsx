import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  Share,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { getRouteDistance } from '../../services/map/mapApi';

// Safely attempt to import react-native-maps to prevent crashes if not installed yet
let MapView, Marker, Polyline;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps.MapView;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
} catch (e) {
  console.log('react-native-maps not found in dependencies, rendering visual fallback.');
}

const { width, height } = Dimensions.get('window');

const RouteMapScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { place } = route.params;

  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState({
    distanceText: '12 km',
    durationText: '25 phút',
  });

  // Mock coordinates for user/hotel location (Origin)
  const origin = {
    lat: 16.0544, // Da Nang city center
    lng: 108.2022,
  };

  const destination = {
    lat: place.coordinates?.lat || 16.0028,
    lng: place.coordinates?.lng || 108.2618,
  };

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        const res = await getRouteDistance(origin, destination);
        if (res.success) {
          // Map "15 mins" to "15 phút" etc.
          let duration = res.data.durationText;
          if (duration.includes('mins')) duration = duration.replace('mins', 'phút');
          if (duration.includes('min')) duration = duration.replace('min', 'phút');

          setRouteInfo({
            distanceText: res.data.distanceText,
            durationText: duration,
          });
        }
      } catch (error) {
        console.error('Error fetching route distance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [place]);

  const handleStartNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Lỗi', 'Không thể mở ứng dụng Bản đồ.');
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Hành trình đi đến ${place.name}: ${routeInfo.distanceText} (${routeInfo.durationText}).`,
        title: `Hành trình ${place.name}`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  // Check if MapView exists
  const hasMapsInstalled = !!MapView;

  return (
    <View style={styles.container}>
      {/* MAP VIEW SECTION */}
      {hasMapsInstalled ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: (origin.lat + destination.lat) / 2,
            longitude: (origin.lng + destination.lng) / 2,
            latitudeDelta: Math.abs(origin.lat - destination.lat) * 2 || 0.1,
            longitudeDelta: Math.abs(origin.lng - destination.lng) * 2 || 0.1,
          }}
        >
          {/* Origin Marker */}
          <Marker
            coordinate={{ latitude: origin.lat, longitude: origin.lng }}
            title="Vị trí của bạn"
            pinColor={COLORS.primary}
          />
          {/* Destination Marker */}
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            title={place.name}
            description={place.address}
          />
          {/* Polyline path */}
          <Polyline
            coordinates={[
              { latitude: origin.lat, longitude: origin.lng },
              { latitude: destination.lat, longitude: destination.lng },
            ]}
            strokeColor={COLORS.primary}
            strokeWidth={4}
          />
        </MapView>
      ) : (
        /* Dynamic High-Fidelity Visual Fallback */
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1000' }}
          style={styles.map}
          resizeMode="cover"
        >
          {/* Visual Overlay representing lines, markers & paths */}
          <View style={styles.fallbackOverlay}>
            <View style={styles.simulationBanner}>
              <Ionicons name="information-circle" size={16} color={COLORS.primaryDark} />
              <Text style={styles.simulationText}>Chế độ giả lập bản đồ hành trình</Text>
            </View>

            {/* Simulated Path Line (SVG-like curves styled using CSS) */}
            <View style={styles.pathLinesContainer}>
              {/* Origin Marker */}
              <View style={[styles.markerBadge, styles.originMarkerPos]}>
                <View style={styles.pulseCircle} />
                <View style={[styles.markerDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.markerLabel}>Vị trí của bạn</Text>
              </View>

              {/* Destination Marker */}
              <View style={[styles.markerBadge, styles.destMarkerPos]}>
                <Ionicons name="location" size={30} color="#EF4444" />
                <Text style={[styles.markerLabel, { color: '#EF4444' }]}>{place.name}</Text>
              </View>

              {/* Simulated Connector Line */}
              <View style={styles.simulatedLine} />
            </View>
          </View>
        </ImageBackground>
      )}

      {/* TOP HEADER CONTROLS */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bản đồ hành trình</Text>
        <TouchableOpacity style={styles.circularBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR OVERLAY */}
      <View style={[styles.searchContainer, { top: insets.top + 60 }]}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.gray[400]} />
          <TextInput
            placeholder="Tìm kiếm địa điểm trên lộ trình..."
            placeholderTextColor={COLORS.gray[400]}
            style={styles.searchInput}
            value={place.name}
            editable={false}
          />
        </View>
      </View>

      {/* FLOATING ROUTE DETAILS BOTTOM SHEET */}
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Chi tiết lộ trình</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.gray[500]} />
              <Text style={styles.sheetSubtitle} numberOfLines={1}>
                {place.address}
              </Text>
            </View>
          </View>
          <View style={styles.statusChip}>
            <Text style={styles.statusText}>Đang di chuyển</Text>
          </View>
        </View>

        {/* Distance and Duration info block */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="navigate-outline" size={20} color={COLORS.info} />
            </View>
            <View>
              <Text style={styles.statLabel}>KHOẢNG CÁCH</Text>
              <Text style={styles.statVal}>{routeInfo.distanceText}</Text>
            </View>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.iconBg, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={20} color={COLORS.warning} />
            </View>
            <View>
              <Text style={styles.statLabel}>THỜI GIAN</Text>
              <Text style={styles.statVal}>{routeInfo.durationText}</Text>
            </View>
          </View>
        </View>

        {/* Start Route Button */}
        <TouchableOpacity style={styles.navBtn} onPress={handleStartNavigation}>
          <Ionicons name="navigate" size={20} color={COLORS.white} />
          <Text style={styles.navBtnText}>Bắt đầu dẫn đường</Text>
        </TouchableOpacity>

        {/* Sub-bottom menu matching drawing */}
        <View style={styles.fakeTabs}>
          <FakeTabItem icon="compass" label="Khám phá" />
          <FakeTabItem icon="map" label="Hành trình" active />
          <FakeTabItem icon="heart" label="Yêu thích" />
          <FakeTabItem icon="person" label="Cá nhân" />
        </View>
      </View>
    </View>
  );
};

const FakeTabItem = ({ icon, label, active }) => (
  <View style={styles.fakeTabItem}>
    <Ionicons name={active ? icon : `${icon}-outline`} size={18} color={active ? COLORS.primary : COLORS.gray[400]} />
    <Text style={[styles.fakeTabLabel, active && { color: COLORS.primary, fontWeight: '700' }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    width: width,
    height: height,
  },
  fallbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulationBanner: {
    position: 'absolute',
    top: 120,
    backgroundColor: '#FFEFE6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  simulationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  pathLinesContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  originMarkerPos: {
    position: 'absolute',
    top: 50,
    left: '20%',
  },
  destMarkerPos: {
    position: 'absolute',
    bottom: 50,
    right: '25%',
    alignItems: 'center',
  },
  markerBadge: {
    alignItems: 'center',
    zIndex: 2,
  },
  pulseCircle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.5,
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  markerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  simulatedLine: {
    position: 'absolute',
    top: 60,
    left: '25%',
    width: '50%',
    height: 140,
    borderStyle: 'dashed',
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    borderRadius: 70,
    transform: [{ rotate: '-15deg' }],
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.black,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  circularBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.gray[200],
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.black,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    width: width * 0.55,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  statusChip: {
    backgroundColor: '#FFEFE6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.gray[400],
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
  },
  navBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  navBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
  fakeTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    marginTop: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  fakeTabItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  fakeTabLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.gray[400],
  },
});

export default RouteMapScreen;
