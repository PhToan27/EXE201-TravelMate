const buildPlacePayload = (place) => ({
  id: place._id,
  name: place.name,
  address: place.address,
  latitude: Number(place.coordinates?.lat || 16.0544),
  longitude: Number(place.coordinates?.lng || 108.2022),
  openHours: place.openHours,
});

const normalizeCoordinatePair = (pair) => {
  if (!Array.isArray(pair) || pair.length < 2) return null;

  const first = Number(pair[0]);
  const second = Number(pair[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  // VietMap returns GeoJSON-style [lng, lat] when points_encoded=false.
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
  if (!coordinates.length) return [];

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

const toRadians = (value) => (Number(value) * Math.PI) / 180;

const calculateAirDistanceKm = (origin, destination) => {
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

const getVehicleSpeedKmh = (vehicle) => {
  if (vehicle === 'foot') return 5;
  if (vehicle === 'bike') return 15;
  if (vehicle === 'car') return 40;
  return 30;
};

const buildFallbackRoute = ({ place, origin, vehicle, reason }) => {
  const placePayload = buildPlacePayload(place);
  const distanceKm = Number(calculateAirDistanceKm(origin, placePayload).toFixed(1));
  const durationMinutes = Math.max(
    1,
    Math.round((distanceKm / getVehicleSpeedKmh(vehicle)) * 60)
  );

  return {
    provider: 'fallback',
    fallbackReason: reason || '',
    place: placePayload,
    distanceKm,
    durationMinutes,
    encodedPolyline: '',
    instructions: [
      {
        text: `Di chuyển đến ${placePayload.name}`,
        distance: Math.round(distanceKm * 1000),
        time: durationMinutes * 60 * 1000,
      },
      {
        text: 'Đích đến',
        distance: 0,
        time: 0,
      },
    ],
    routeCoordinates: [
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: placePayload.latitude, longitude: placePayload.longitude },
    ],
    routeSegments: [
      {
        trafficLevel: 'low',
        coordinates: [
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: placePayload.latitude, longitude: placePayload.longitude },
        ],
      },
    ],
    openingStatus: {
      isOpen: null,
      message: placePayload.openHours || 'Chưa có dữ liệu giờ mở cửa',
    },
    trafficLevel: 'low',
  };
};

const normalizeVehicle = (vehicle) => {
  if (['car', 'bike', 'foot', 'motorcycle'].includes(vehicle)) return vehicle;
  return 'motorcycle';
};

const fetchVietMapRoute = async ({ origin, destination, vehicle }) => {
  const apiKey = process.env.VIETMAP_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VIETMAP_API_KEY');
  }

  const url = new URL('https://maps.vietmap.vn/api/route');
  url.searchParams.append('api-version', '1.1');
  url.searchParams.append('apikey', apiKey);
  url.searchParams.append('point', `${origin.latitude},${origin.longitude}`);
  url.searchParams.append('point', `${destination.latitude},${destination.longitude}`);
  url.searchParams.append('vehicle', normalizeVehicle(vehicle));
  url.searchParams.append('points_encoded', 'false');
  url.searchParams.append('optimize', 'false');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const payload = await response.json();

    if (!response.ok || payload.code !== 'OK' || !payload.paths?.[0]) {
      throw new Error(payload.messages || payload.message || 'VietMap route failed');
    }

    return payload.paths[0];
  } finally {
    clearTimeout(timeout);
  }
};

const getNavigationToPlace = async ({ place, origin, vehicle }) => {
  const normalizedVehicle = normalizeVehicle(vehicle);
  const destination = buildPlacePayload(place);

  try {
    const path = await fetchVietMapRoute({
      origin,
      destination,
      vehicle: normalizedVehicle,
    });
    const routeCoordinates = normalizeRouteCoordinates(path.points);
    const routeSegments = buildRouteSegments(
      routeCoordinates,
      path.instructions || [],
      normalizedVehicle
    );
    const hasCongestion = routeSegments.some((segment) => segment.trafficLevel === 'high');
    const hasMediumTraffic = routeSegments.some((segment) => segment.trafficLevel === 'medium');

    return {
      provider: 'vietmap',
      place: destination,
      distanceKm: Number((Number(path.distance || 0) / 1000).toFixed(1)),
      durationMinutes: Math.max(1, Math.round(Number(path.time || 0) / 60000)),
      encodedPolyline: '',
      routeCoordinates,
      routeSegments,
      instructions: path.instructions || [],
      openingStatus: {
        isOpen: null,
        message: destination.openHours || 'Chưa có dữ liệu giờ mở cửa',
      },
      trafficLevel: hasCongestion ? 'high' : hasMediumTraffic ? 'medium' : 'low',
    };
  } catch (error) {
    return buildFallbackRoute({
      place,
      origin,
      vehicle: normalizedVehicle,
      reason: error.message,
    });
  }
};

module.exports = {
  getNavigationToPlace,
};
