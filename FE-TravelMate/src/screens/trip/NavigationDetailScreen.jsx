import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { getNavigationToPlace } from '../../services/navigation/navigationApi';

const DEFAULT_VEHICLE = 'motorcycle';

const decodePolyline = (encoded = '') => {
  const coordinates = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = null;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLatitude = result & 1 ? ~(result >> 1) : result >> 1;
    latitude += deltaLatitude;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLongitude = result & 1 ? ~(result >> 1) : result >> 1;
    longitude += deltaLongitude;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
};

const formatTraffic = (trafficLevel) => {
  if (trafficLevel === 'low') return 'Thong thoang';
  if (trafficLevel === 'medium') return 'Trung binh';
  if (trafficLevel === 'high') return 'Dong';
  return 'Chua co du lieu giao thong';
};

const NavigationDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const { placeId, placeName, vehicle = DEFAULT_VEHICLE } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [origin, setOrigin] = useState(null);
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          setErrorMessage('Can quyen GPS de lay vi tri hien tai.');
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const currentOrigin = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setOrigin(currentOrigin);

        const response = await getNavigationToPlace(placeId, {
          fromLat: currentOrigin.latitude,
          fromLng: currentOrigin.longitude,
          vehicle,
        });

        if (!response.success) {
          setErrorMessage(response.message || 'Khong the lay du lieu dan duong.');
          return;
        }

        setRouteData(response.data);
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          'Khong the lay du lieu dan duong.';
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    };

    if (!placeId) {
      setErrorMessage('Thieu thong tin dia diem.');
      setLoading(false);
      return;
    }

    loadNavigation();
  }, [placeId, vehicle]);

  const destination = useMemo(() => {
    if (!routeData?.place) return null;

    return {
      latitude: routeData.place.latitude,
      longitude: routeData.place.longitude,
    };
  }, [routeData]);

  const routeCoordinates = useMemo(() => {
    const decoded = decodePolyline(routeData?.encodedPolyline || '');
    if (decoded.length) return decoded;
    return origin && destination ? [origin, destination] : [];
  }, [routeData, origin, destination]);

  useEffect(() => {
    if (mapRef.current && routeCoordinates.length > 1) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 120, right: 40, bottom: 320, left: 40 },
        animated: true,
      });
    }
  }, [routeCoordinates]);

  const handleRetry = () => {
    navigation.replace('NavigationDetail', { placeId, placeName, vehicle });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.centerText}>Dang lay vi tri va duong di...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={56} color={COLORS.error} />
        <Text style={styles.errorTitle}>{placeName || 'Dan duong'}</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryButtonText}>Quay lai</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Text style={styles.primaryButtonText}>Thu lai</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const openingMessage = routeData?.openingStatus?.message || 'Chua co du lieu gio mo cua';
  const trafficMessage = formatTraffic(routeData?.trafficLevel);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: origin?.latitude || destination?.latitude || 16.0544,
          longitude: origin?.longitude || destination?.longitude || 108.2022,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {origin && (
          <Marker coordinate={origin} title="Vi tri cua ban" pinColor={COLORS.primary} />
        )}
        {destination && (
          <Marker
            coordinate={destination}
            title={routeData.place.name}
            description={routeData.place.address}
          />
        )}
        {routeCoordinates.length > 1 && (
          <Polyline coordinates={routeCoordinates} strokeColor={COLORS.primary} strokeWidth={5} />
        )}
      </MapView>

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dan duong</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => Alert.alert('Trang thai giao thong', trafficMessage)}
        >
          <Ionicons name="information-circle-outline" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.placeName}>{routeData.place.name}</Text>
        {!!routeData.place.address && <Text style={styles.address}>{routeData.place.address}</Text>}

        <View style={styles.statsRow}>
          <InfoBox icon="navigate-outline" label="Khoang cach" value={`${routeData.distanceKm} km`} />
          <InfoBox icon="time-outline" label="Thoi gian" value={`${routeData.durationMinutes} phut`} />
        </View>

        <View style={styles.statusGrid}>
          <StatusRow icon="time" label="Mo cua" value={openingMessage} />
          <StatusRow icon="car" label="Giao thong" value={trafficMessage} />
        </View>

        <Text style={styles.instructionsTitle}>Chi dan tung buoc</Text>
        <ScrollView style={styles.instructionsList} showsVerticalScrollIndicator={false}>
          {(routeData.instructions || []).map((instruction, index) => (
            <View key={`${instruction.text}-${index}`} style={styles.instructionRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepText}>{index + 1}</Text>
              </View>
              <View style={styles.instructionBody}>
                <Text style={styles.instructionText}>{instruction.text || 'Tiep tuc di chuyen'}</Text>
                <Text style={styles.instructionMeta}>
                  {Math.round(Number(instruction.distance || 0))} m - {Math.max(1, Math.round(Number(instruction.time || 0) / 60000))} phut
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const InfoBox = ({ icon, label, value }) => (
  <View style={styles.infoBox}>
    <Ionicons name={icon} size={20} color={COLORS.primary} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const StatusRow = ({ icon, label, value }) => (
  <View style={styles.statusRow}>
    <Ionicons name={icon} size={17} color={COLORS.gray[500]} />
    <Text style={styles.statusLabel}>{label}</Text>
    <Text style={styles.statusValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  centerText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  errorActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  primaryButtonText: { color: COLORS.white, fontWeight: '800' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
  },
  secondaryButtonText: { color: COLORS.gray[700], fontWeight: '800' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '48%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 10,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.gray[200],
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  placeName: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.black,
  },
  address: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.gray[500],
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  infoBox: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  infoLabel: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.gray[500],
    fontWeight: '700',
  },
  infoValue: {
    marginTop: 2,
    fontSize: 17,
    color: COLORS.black,
    fontWeight: '800',
  },
  statusGrid: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusLabel: {
    width: 80,
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '700',
  },
  statusValue: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray[800],
    fontWeight: '600',
  },
  instructionsTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.black,
  },
  instructionsList: {
    flexGrow: 0,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  instructionBody: { flex: 1 },
  instructionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
    lineHeight: 18,
  },
  instructionMeta: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.gray[500],
  },
});

export default NavigationDetailScreen;
