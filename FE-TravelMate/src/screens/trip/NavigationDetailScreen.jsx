import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { COLORS, SPACING, RADIUS, VIETMAP_API_KEY } from '../../utils/constants';
import { getNavigationToPlace } from '../../services/navigation/navigationApi';

const DEFAULT_VEHICLE = 'motorcycle';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MIN_HEIGHT = Math.round(SCREEN_HEIGHT * 0.34);
const SHEET_MID_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
const SHEET_MAX_HEIGHT = Math.round(SCREEN_HEIGHT * 0.78);
const SHEET_SNAP_POINTS = [SHEET_MIN_HEIGHT, SHEET_MID_HEIGHT, SHEET_MAX_HEIGHT];

const clampSheetHeight = (height) =>
  Math.min(SHEET_MAX_HEIGHT, Math.max(SHEET_MIN_HEIGHT, height));

const getNearestSheetHeight = (height) =>
  SHEET_SNAP_POINTS.reduce((nearest, point) =>
    Math.abs(point - height) < Math.abs(nearest - height) ? point : nearest
  );
const LOCATION_TIMEOUT_MS = 12000;

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
  if (trafficLevel === 'low') return 'Thông thoáng';
  if (trafficLevel === 'medium') return 'Trung bình';
  if (trafficLevel === 'high') return 'Đông';
  return 'Chưa có dữ liệu giao thông';
};

const getTrafficColor = (trafficLevel) => {
  if (trafficLevel === 'high' || trafficLevel === 'medium') return '#EF4444';
  return '#22C55E';
};

const normalizeSearchText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

const getPreferredSearchQuery = (place) => {
  const raw = `${place?.name || ''} ${place?.address || ''}`;
  const normalized = normalizeSearchText(raw);

  if (normalized.includes('banh trang') && normalized.includes('tran')) {
    return 'Nhà Hàng Trần 4 Lê Duẩn Đà Nẵng';
  }

  if (normalized.includes('mi quang') && normalized.includes('ba mua')) {
    return 'Mì Quảng Bà Mua Nguyễn Tri Phương Đà Nẵng';
  }

  return `${place?.name || ''} ${place?.address || 'Đà Nẵng'}`.trim();
};

const normalizeCoordinatePair = (pair) => {
  if (!Array.isArray(pair) || pair.length < 2) return null;

  const first = Number(pair[0]);
  const second = Number(pair[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  return Math.abs(first) > 90
    ? { latitude: second, longitude: first }
    : { latitude: first, longitude: second };
};

const normalizeRouteCoordinates = (points) => {
  const pairs = Array.isArray(points?.coordinates)
    ? points.coordinates
    : Array.isArray(points)
      ? points
      : [];

  return pairs.map(normalizeCoordinatePair).filter(Boolean);
};

const getTrafficLevelFromInstruction = (instruction, vehicle) => {
  const distanceKm = Number(instruction?.distance || 0) / 1000;
  const durationHours = Number(instruction?.time || 0) / 3600000;
  if (!distanceKm || !durationHours) return 'low';

  const speedKmh = distanceKm / durationHours;
  const highLimit = vehicle === 'foot' ? 3 : vehicle === 'bike' ? 8 : 12;
  const mediumLimit = vehicle === 'foot' ? 5 : vehicle === 'bike' ? 14 : 22;

  if (speedKmh <= highLimit) return 'high';
  if (speedKmh <= mediumLimit) return 'medium';
  return 'low';
};

const buildRouteSegments = (coordinates, instructions, vehicle) => {
  const segments = (instructions || [])
    .map((instruction) => {
      const [startIndex, endIndex] = instruction.interval || [];
      if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) return null;

      const segmentCoordinates = coordinates.slice(startIndex, endIndex + 1);
      if (segmentCoordinates.length < 2) return null;

      return {
        trafficLevel: getTrafficLevelFromInstruction(instruction, vehicle),
        coordinates: segmentCoordinates,
      };
    })
    .filter(Boolean);

  return segments.length ? segments : [{ trafficLevel: 'low', coordinates }];
};

const fetchVietMapPlaceCoordinate = async (place) => {
  if (!VIETMAP_API_KEY) return null;

  const query = encodeURIComponent(getPreferredSearchQuery(place));
  const searchUrl = `https://maps.vietmap.vn/api/search/v3?apikey=${VIETMAP_API_KEY}&text=${query}`;
  const searchResponse = await fetch(searchUrl);
  const searchPayload = await searchResponse.json();
  const bestMatch = searchPayload?.value?.[0];
  if (!bestMatch?.ref_id) return null;

  const detailUrl = `https://maps.vietmap.vn/api/place/v3?apikey=${VIETMAP_API_KEY}&refid=${encodeURIComponent(bestMatch.ref_id)}`;
  const detailResponse = await fetch(detailUrl);
  const detailPayload = await detailResponse.json();

  if (!Number.isFinite(Number(detailPayload.lat)) || !Number.isFinite(Number(detailPayload.lng))) {
    return null;
  }

  return {
    latitude: Number(detailPayload.lat),
    longitude: Number(detailPayload.lng),
    address: detailPayload.display || detailPayload.address || place?.address,
    name: detailPayload.name || place?.name,
  };
};

const fetchClientVietMapRoute = async ({ place, originPoint, vehicle }) => {
  if (!VIETMAP_API_KEY) {
    throw new Error('Missing VietMap key in Expo env');
  }

  const resolvedPlace = await fetchVietMapPlaceCoordinate(place);
  const dbDestination = getPlaceCoordinate(place);
  const destination = resolvedPlace || dbDestination;
  if (!destination) {
    throw new Error('Dia diem chua co toa do hop le');
  }
  const routeUrl = [
    'https://maps.vietmap.vn/api/route?api-version=1.1',
    `apikey=${VIETMAP_API_KEY}`,
    `point=${originPoint.latitude},${originPoint.longitude}`,
    `point=${destination.latitude},${destination.longitude}`,
    `vehicle=${vehicle || DEFAULT_VEHICLE}`,
    'points_encoded=false',
    'optimize=false',
  ].join('&');

  const routeResponse = await fetch(routeUrl);
  const routePayload = await routeResponse.json();
  const path = routePayload?.paths?.[0];

  if (!routeResponse.ok || routePayload.code !== 'OK' || !path) {
    throw new Error(routePayload?.message || routePayload?.messages || 'VietMap route failed');
  }

  const routeCoordinates = normalizeRouteCoordinates(path.points);
  if (routeCoordinates.length < 3) {
    throw new Error('VietMap route returned too few coordinates');
  }

  const instructions = path.instructions || [];
  const routeSegments = buildRouteSegments(routeCoordinates, instructions, vehicle);
  const hasHighTraffic = routeSegments.some((segment) => segment.trafficLevel === 'high');
  const hasMediumTraffic = routeSegments.some((segment) => segment.trafficLevel === 'medium');

  return {
    provider: 'vietmap-client',
    place: {
      id: place?._id || place?.id,
      name: resolvedPlace?.name || place?.name || 'Địa điểm',
      address: resolvedPlace?.address || place?.address || '',
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
    routeCoordinates,
    routeSegments,
    distanceKm: Number((Number(path.distance || 0) / 1000).toFixed(1)),
    durationMinutes: Math.max(1, Math.round(Number(path.time || 0) / 60000)),
    encodedPolyline: '',
    instructions,
    openingStatus: {
      isOpen: null,
      message: place?.openHours || 'Chưa có dữ liệu giờ mở cửa',
    },
    trafficLevel: hasHighTraffic ? 'high' : hasMediumTraffic ? 'medium' : 'low',
  };
};

const shouldUpgradeRoute = (data) =>
  !data ||
  ['fallback', 'local-fallback'].includes(data.provider) ||
  isDefaultDaNangCoordinate({
    latitude: data?.place?.latitude,
    longitude: data?.place?.longitude,
  }) ||
  (data.routeCoordinates || []).length <= 2 ||
  (data.instructions || []).length <= 2;

const toRadians = (value) => (Number(value) * Math.PI) / 180;

const calculateDistanceKm = (origin, destination) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLng = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const isDefaultDaNangCoordinate = (point) =>
  point &&
  Math.abs(Number(point.latitude) - 16.0544) < 0.0002 &&
  Math.abs(Number(point.longitude) - 108.2022) < 0.0002;

const getPlaceCoordinate = (place) => {
  const latitude = Number(place?.coordinates?.lat ?? place?.latitude);
  const longitude = Number(place?.coordinates?.lng ?? place?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const point = { latitude, longitude };
  return isDefaultDaNangCoordinate(point) ? null : point;
};

const buildLocalRoute = (place, originPoint, vehicle, reason = '') => {
  const destination = getPlaceCoordinate(place);
  if (!destination) {
    throw new Error(reason || 'Dia diem chua co toa do hop le');
  }
  const distanceKm = Number(calculateDistanceKm(originPoint, destination).toFixed(1));
  const speedKmh = vehicle === 'foot' ? 5 : vehicle === 'bike' ? 15 : vehicle === 'car' ? 40 : 30;
  const durationMinutes = Math.max(1, Math.round((distanceKm / speedKmh) * 60));

  return {
    provider: 'local-fallback',
    fallbackReason: reason,
    place: {
      id: place?._id || place?.id,
      name: place?.name || 'Địa điểm',
      address: place?.address || '',
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
    routeCoordinates: [originPoint, destination],
    routeSegments: [
      {
        trafficLevel: 'low',
        coordinates: [originPoint, destination],
      },
    ],
    distanceKm,
    durationMinutes,
    encodedPolyline: '',
    instructions: [
      {
        text: `Di chuyển đến ${place?.name || 'địa điểm'}`,
        distance: Math.round(distanceKm * 1000),
        time: durationMinutes * 60 * 1000,
      },
      { text: 'Đích đến', distance: 0, time: 0 },
    ],
    openingStatus: {
      isOpen: null,
      message: place?.openHours || 'Chưa có dữ liệu giờ mở cửa',
    },
    trafficLevel: 'low',
  };
};

const tryBuildLocalRoute = ({ place, originPoint, vehicle, reason, onSuccess }) => {
  try {
    onSuccess(buildLocalRoute(place, originPoint, vehicle, reason));
    return true;
  } catch {
    return false;
  }
};

const withTimeout = (promise, timeoutMs, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);

const NavigationDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const { placeId, placeName, place: initialPlace, vehicle = DEFAULT_VEHICLE } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [origin, setOrigin] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [sheetHeight, setSheetHeight] = useState(SHEET_MID_HEIGHT);
  const sheetHeightRef = useRef(SHEET_MID_HEIGHT);
  const dragStartHeightRef = useRef(SHEET_MID_HEIGHT);

  const setClampedSheetHeight = useCallback((height) => {
    const nextHeight = clampSheetHeight(height);
    sheetHeightRef.current = nextHeight;
    setSheetHeight(nextHeight);
  }, []);

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          dragStartHeightRef.current = sheetHeightRef.current;
        },
        onPanResponderMove: (_, gestureState) => {
          setClampedSheetHeight(dragStartHeightRef.current - gestureState.dy);
        },
        onPanResponderRelease: (_, gestureState) => {
          const projectedHeight = dragStartHeightRef.current - gestureState.dy;
          setClampedSheetHeight(getNearestSheetHeight(projectedHeight));
        },
      }),
    [setClampedSheetHeight]
  );

  useEffect(() => {
    const loadNavigation = async () => {
      let fallbackOrigin = null;

      try {
        setLoading(true);
        setErrorMessage('');

        const permission = await Location.requestForegroundPermissionsAsync();
        let currentOrigin = null;

        if (permission.status === 'granted') {
          let current;
          try {
            current = await withTimeout(
              Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              }),
              LOCATION_TIMEOUT_MS,
              'Khong the lay vi tri hien tai. Hay kiem tra GPS va thu lai.'
            );
          } catch (locationError) {
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (!lastKnown) {
              throw locationError;
            }
            current = lastKnown;
          }

          currentOrigin = {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          };
        } else if (initialPlace) {
          const destinationPoint = getPlaceCoordinate(initialPlace);
          if (!destinationPoint) {
            setErrorMessage('Dia diem chua co toa do hop le de dan duong.');
            return;
          }
          currentOrigin = {
            latitude: destinationPoint.latitude + 0.03,
            longitude: destinationPoint.longitude - 0.03,
          };
        } else {
          setErrorMessage('Cần quyền GPS để lấy vị trí hiện tại.');
          return;
        }

        fallbackOrigin = currentOrigin;
        setOrigin(currentOrigin);

        if (initialPlace) {
          try {
            const clientRoute = await fetchClientVietMapRoute({
              place: initialPlace,
              originPoint: currentOrigin,
              vehicle,
            });
            setRouteData(clientRoute);
            return;
          } catch (clientError) {
            if (!placeId) {
              const hasLocalRoute = tryBuildLocalRoute({
                place: initialPlace,
                originPoint: currentOrigin,
                vehicle,
                reason: clientError.message,
                onSuccess: setRouteData,
              });

              if (!hasLocalRoute) {
                setErrorMessage(clientError.message || 'Khong the lay du lieu dan duong.');
              }
              return;
            }
          }
        }

        const response = await getNavigationToPlace(placeId, {
          fromLat: currentOrigin.latitude,
          fromLng: currentOrigin.longitude,
          vehicle,
          placeName,
        });

        if (!response.success) {
          if (initialPlace) {
            try {
              const clientRoute = await fetchClientVietMapRoute({
                place: initialPlace,
                originPoint: currentOrigin,
                vehicle,
              });
              setRouteData(clientRoute);
            } catch {
              const hasLocalRoute = tryBuildLocalRoute({
                place: initialPlace,
                originPoint: currentOrigin,
                vehicle,
                reason: response.message,
                onSuccess: setRouteData,
              });

              if (!hasLocalRoute) {
                setErrorMessage(response.message || 'Khong the lay du lieu dan duong.');
              }
            }
            return;
          }
          setErrorMessage(response.message || 'Khong the lay du lieu dan duong.');
          return;
        }

        if (initialPlace && shouldUpgradeRoute(response.data)) {
          try {
            const clientRoute = await fetchClientVietMapRoute({
              place: initialPlace,
              originPoint: currentOrigin,
              vehicle,
            });
            setRouteData(clientRoute);
            return;
          } catch {
            // Keep the backend response if client-side VietMap also fails.
          }
        }

        setRouteData(response.data);
      } catch (error) {
        console.log('Navigation API error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          params: error.config?.params,
        });
        const message =
          error.response?.data?.message ||
          (error.response?.status ? `Loi API ${error.response.status}` : '') ||
          error.message ||
          'Khong the lay du lieu dan duong.';
        if (initialPlace) {
          if (!fallbackOrigin) {
            const destinationPoint = getPlaceCoordinate(initialPlace);
            if (!destinationPoint) {
              setErrorMessage(message);
              return;
            }
            fallbackOrigin = {
              latitude: destinationPoint.latitude + 0.03,
              longitude: destinationPoint.longitude - 0.03,
            };
            setOrigin(fallbackOrigin);
          }

          try {
            const clientRoute = await fetchClientVietMapRoute({
              place: initialPlace,
              originPoint: fallbackOrigin,
              vehicle,
            });
            setRouteData(clientRoute);
          } catch {
            const hasLocalRoute = tryBuildLocalRoute({
              place: initialPlace,
              originPoint: fallbackOrigin,
              vehicle,
              reason: message,
              onSuccess: setRouteData,
            });

            if (!hasLocalRoute) {
              setErrorMessage(message);
            }
          }
          return;
        }

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    };

    if (!placeId && !initialPlace) {
      setErrorMessage('Thiếu thông tin địa điểm.');
      setLoading(false);
      return;
    }

    loadNavigation();
  }, [placeId, initialPlace, vehicle]);

  const destination = useMemo(() => {
    if (!routeData?.place) return null;

    return {
      latitude: routeData.place.latitude,
      longitude: routeData.place.longitude,
    };
  }, [routeData]);

  const routeCoordinates = useMemo(() => {
    if (routeData?.routeCoordinates?.length) return routeData.routeCoordinates;
    const decoded = decodePolyline(routeData?.encodedPolyline || '');
    if (decoded.length) return decoded;
    return origin && destination ? [origin, destination] : [];
  }, [routeData, origin, destination]);

  const routeSegments = useMemo(() => {
    if (routeData?.routeSegments?.length) return routeData.routeSegments;
    return routeCoordinates.length > 1
      ? [{ trafficLevel: routeData?.trafficLevel || 'low', coordinates: routeCoordinates }]
      : [];
  }, [routeData, routeCoordinates]);

  useEffect(() => {
    if (mapRef.current && routeCoordinates.length > 1) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 120, right: 40, bottom: 320, left: 40 },
        animated: true,
      });
    }
  }, [routeCoordinates]);

  const handleRetry = () => {
    navigation.replace('NavigationDetail', { placeId, placeName, place: initialPlace, vehicle });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.centerText}>Đang lấy vị trí và đường đi...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={56} color={COLORS.error} />
        <Text style={styles.errorTitle}>{placeName || 'Dẫn đường'}</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryButtonText}>Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Text style={styles.primaryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!routeData?.place) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="map-outline" size={56} color={COLORS.gray[400]} />
        <Text style={styles.errorTitle}>{placeName || 'Dẫn đường'}</Text>
        <Text style={styles.errorText}>Chưa có dữ liệu dẫn đường cho địa điểm này.</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryButtonText}>Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Text style={styles.primaryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const openingMessage = routeData?.openingStatus?.message || 'Chưa có dữ liệu giờ mở cửa';
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
          <Marker coordinate={origin} title="Vị trí của bạn" pinColor={COLORS.primary} />
        )}
        {destination && (
          <Marker
            coordinate={destination}
            title={routeData.place.name}
            description={routeData.place.address}
          />
        )}
        {routeSegments.map((segment, index) => (
          <Polyline
            key={`${segment.trafficLevel}-${index}`}
            coordinates={segment.coordinates}
            strokeColor={getTrafficColor(segment.trafficLevel)}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ))}
      </MapView>

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dẫn đường</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => Alert.alert('Trạng thái giao thông', trafficMessage)}
        >
          <Ionicons name="information-circle-outline" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <View style={[styles.sheet, { height: sheetHeight, paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.dragArea} {...sheetPanResponder.panHandlers}>
          <View style={styles.sheetHandle} />
        </View>
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.placeName}>{routeData.place.name}</Text>
          {!!routeData.place.address && <Text style={styles.address}>{routeData.place.address}</Text>}

          <View style={styles.statsRow}>
            <InfoBox icon="navigate-outline" label="Khoảng cách" value={`${routeData.distanceKm} km`} />
            <InfoBox icon="time-outline" label="Thời gian" value={`${routeData.durationMinutes} phút`} />
          </View>

          <View style={styles.statusGrid}>
            <StatusRow icon="time" label="Mở cửa" value={openingMessage} />
            <StatusRow icon="car" label="Giao thông" value={trafficMessage} />
          </View>

          <Text style={styles.instructionsTitle}>Chỉ dẫn từng bước</Text>
          {(routeData.instructions || []).map((instruction, index) => (
            <View key={`${instruction.text}-${index}`} style={styles.instructionRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepText}>{index + 1}</Text>
              </View>
              <View style={styles.instructionBody}>
                <Text style={styles.instructionText}>{instruction.text || 'Tiếp tục di chuyển'}</Text>
                <Text style={styles.instructionMeta}>
                  {Math.round(Number(instruction.distance || 0))} m - {Math.max(1, Math.round(Number(instruction.time || 0) / 60000))} phút
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
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 10,
  },
  dragArea: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.gray[200],
    alignSelf: 'center',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingBottom: SPACING.xl,
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
