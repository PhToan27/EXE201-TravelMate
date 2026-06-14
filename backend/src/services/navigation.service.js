const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const Place = require('../models/Place');
const placeService = require('./place.service');

const VIETMAP_ROUTE_URL = 'https://maps.vietmap.vn/api/route';
const ALLOWED_VEHICLES = new Set(['car', 'bike', 'foot', 'motorcycle']);

const isValidCoordinate = (value, min, max) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= min && numberValue <= max;
};

const normalizeVehicle = (vehicle) => {
  const cleanVehicle = String(vehicle || 'motorcycle').toLowerCase();
  return ALLOWED_VEHICLES.has(cleanVehicle) ? cleanVehicle : 'motorcycle';
};

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hasCoordinates = (coordinates) =>
  isValidCoordinate(coordinates?.lat, -90, 90) &&
  isValidCoordinate(coordinates?.lng, -180, 180);

const findPlaceByActivityName = async (activity) => {
  const name = activity?.locationName || activity?.title;
  if (!name || name === 'N/A') {
    return null;
  }

  return Place.findOne({
    name: {
      $regex: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    },
  });
};

const getPlaceTarget = async (placeId, placeName) => {
  if (!mongoose.Types.ObjectId.isValid(placeId)) {
    if (!placeName) {
      const error = new Error('placeId khong hop le');
      error.statusCode = 400;
      throw error;
    }

    const placeFromName = await placeService.getPlaceDetails(placeName);
    return {
      id: placeFromName._id?.toString(),
      name: placeFromName.name,
      address: placeFromName.address || '',
      coordinates: placeFromName.coordinates,
      openingHours: placeFromName.openingHours,
      openHours: placeFromName.openHours,
    };
  }

  const [place, activity] = await Promise.all([
    Place.findById(placeId),
    Activity.findById(placeId),
  ]);

  if (place) {
    return {
      id: place._id.toString(),
      name: place.name,
      address: place.address || '',
      coordinates: place.coordinates,
      openingHours: place.openingHours,
      openHours: place.openHours,
    };
  }

  if (!activity) {
    if (placeName) {
      const placeFromName = await placeService.getPlaceDetails(placeName);
      return {
        id: placeFromName._id?.toString(),
        name: placeFromName.name,
        address: placeFromName.address || '',
        coordinates: placeFromName.coordinates,
        openingHours: placeFromName.openingHours,
        openHours: placeFromName.openHours,
      };
    }

    const error = new Error('Khong tim thay dia diem');
    error.statusCode = 404;
    throw error;
  }

  if (hasCoordinates(activity.location)) {
    return {
      id: activity._id.toString(),
      name: activity.locationName || activity.title || 'Dia diem',
      address: activity.address || '',
      coordinates: activity.location,
      openingHours: activity.openingHours,
      openHours: activity.openHours,
    };
  }

  const matchedPlace = await findPlaceByActivityName(activity);
  if (matchedPlace && hasCoordinates(matchedPlace.coordinates)) {
    return {
      id: matchedPlace._id.toString(),
      sourceActivityId: activity._id.toString(),
      name: matchedPlace.name,
      address: matchedPlace.address || activity.address || '',
      coordinates: matchedPlace.coordinates,
      openingHours: matchedPlace.openingHours,
      openHours: matchedPlace.openHours,
    };
  }

  const error = new Error('Dia diem nay chua co toa do de dan duong');
  error.statusCode = 422;
  throw error;
};

const parseOpeningRange = (value) => {
  const text = String(value || '');
  const match = text.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);

  if (!match) {
    return null;
  }

  return {
    open: `${match[1].padStart(2, '0')}:${match[2]}`,
    close: `${match[3].padStart(2, '0')}:${match[4]}`,
  };
};

const minutesFromTime = (timeText) => {
  const [hours, minutes] = String(timeText).split(':').map(Number);
  return hours * 60 + minutes;
};

const getOpeningStatus = (target) => {
  const rawHours = target.openingHours || target.openHours;
  const structuredHours =
    rawHours && typeof rawHours === 'object'
      ? rawHours
      : parseOpeningRange(rawHours);

  if (!structuredHours?.open || !structuredHours?.close) {
    return {
      isOpen: null,
      message: 'Chua co du lieu gio mo cua',
      rawHours: rawHours || null,
    };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = minutesFromTime(structuredHours.open);
  const closeMinutes = minutesFromTime(structuredHours.close);
  const isOpen =
    openMinutes <= closeMinutes
      ? currentMinutes >= openMinutes && currentMinutes <= closeMinutes
      : currentMinutes >= openMinutes || currentMinutes <= closeMinutes;

  return {
    isOpen,
    message: isOpen ? 'Dia diem dang mo cua' : 'Dia diem hien da dong cua',
    rawHours: rawHours || structuredHours,
  };
};

const buildRouteUrl = ({ fromLat, fromLng, toLat, toLng, vehicle }) => {
  const params = new URLSearchParams();
  params.append('api-version', '1.1');
  params.append('apikey', process.env.VIETMAP_API_KEY);
  params.append('point', `${fromLat},${fromLng}`);
  params.append('point', `${toLat},${toLng}`);
  params.append('vehicle', vehicle);
  params.append('points_encoded', 'true');

  return `${VIETMAP_ROUTE_URL}?${params.toString()}`;
};

const getRouteToPlace = async ({ placeId, placeName, fromLat, fromLng, vehicle }) => {
  if (!process.env.VIETMAP_API_KEY) {
    const error = new Error('Missing VIETMAP_API_KEY');
    error.statusCode = 500;
    throw error;
  }

  if (!isValidCoordinate(fromLat, -90, 90) || !isValidCoordinate(fromLng, -180, 180)) {
    const error = new Error('Toa do xuat phat khong hop le');
    error.statusCode = 400;
    throw error;
  }

  const target = await getPlaceTarget(placeId, placeName);
  if (!hasCoordinates(target.coordinates)) {
    const error = new Error('Dia diem nay chua co toa do de dan duong');
    error.statusCode = 422;
    throw error;
  }

  const selectedVehicle = normalizeVehicle(vehicle);
  const routeUrl = buildRouteUrl({
    fromLat: Number(fromLat),
    fromLng: Number(fromLng),
    toLat: Number(target.coordinates.lat),
    toLng: Number(target.coordinates.lng),
    vehicle: selectedVehicle,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let vietMapData;

  try {
    const response = await fetch(routeUrl, { signal: controller.signal });
    vietMapData = await response.json();

    if (!response.ok) {
      const error = new Error(vietMapData?.message || vietMapData?.messages || 'VietMap request failed');
      error.statusCode = response.status;
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }

  const path = vietMapData?.paths?.[0];

  if (!path) {
    const error = new Error('VietMap khong tra ve du lieu tuyen duong');
    error.statusCode = 502;
    throw error;
  }

  return {
    place: {
      id: target.id,
      sourceActivityId: target.sourceActivityId,
      name: target.name,
      address: target.address,
      latitude: Number(target.coordinates.lat),
      longitude: Number(target.coordinates.lng),
    },
    distanceKm: Math.round((Number(path.distance || 0) / 1000) * 10) / 10,
    durationMinutes: Math.max(1, Math.round(Number(path.time || 0) / 60000)),
    encodedPolyline: path.points || '',
    instructions: Array.isArray(path.instructions) ? path.instructions : [],
    trafficLevel: 'unknown',
    openingStatus: getOpeningStatus(target),
    vehicle: selectedVehicle,
  };
};

module.exports = {
  getRouteToPlace,
};
