const Place = require('../models/Place');

const INTEREST_KEYWORDS = {
  'Ăn uống': ['am thuc', 'an uong', 'quan an', 'nha hang', 'cafe', 'ca phe', 'hai san', 'cho dem'],
  'Thiên nhiên': ['thien nhien', 'bien', 'bai', 'nui', 'rung', 'suoi', 'doi che', 'ban dao'],
  'Văn hóa': ['van hoa', 'lich su', 'bao tang', 'chua', 'den', 'pho co', 'di tich'],
  'Biển': ['bien', 'bai', 'dao', 'son tra', 'beach'],
  'Phiêu lưu': ['trek', 'leo', 'thac', 'cap treo', 'thuyen thung', 'dong'],
  'Chụp ảnh': ['chup anh', 'check-in', 'check in', 'pho co', 'doi che', 'hoang hon', 'canh'],
  'Mua sắm': ['mua sam', 'cho', 'dac san', 'qua luu niem'],
  'Thư giãn': ['thu gian', 'nghi ngoi', 'ho', 'bien', 'spa', 'cong vien'],
};

const DESTINATION_ALIASES = {
  'ha noi': ['ha noi', 'hoan kiem', 'ba dinh', 'dong da', 'hai ba trung'],
  'da nang': ['da nang', 'hai chau', 'son tra', 'ngu hanh son', 'thanh khe'],
  'hoi an': ['hoi an', 'cam thanh', 'an hoi'],
  'da lat': ['da lat', 'lam dong', 'xuan truong'],
  'phu quoc': ['phu quoc', 'duong dong', 'an thoi', 'duong to'],
};

const MIN_ACTIVITIES_PER_DAY = 6;
const MAX_ACTIVITIES_PER_DAY = 7;

const TIME_SLOTS = {
  6: [
    '07:30 - 08:30',
    '09:00 - 10:30',
    '11:00 - 12:00',
    '13:30 - 14:30',
    '15:00 - 16:30',
    '18:00 - 19:30',
  ],
  7: [
    '07:30 - 08:30',
    '09:00 - 10:00',
    '10:30 - 11:30',
    '12:00 - 13:00',
    '14:00 - 15:00',
    '15:30 - 17:00',
    '18:00 - 19:30',
  ],
};

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim()
    .replace(/\s+/g, ' ');

const getPlaceText = (place) =>
  normalizeText(
    [place.name, place.category, place.address, place.introduction, place.openHours]
      .filter(Boolean)
      .join(' ')
  );

const isStayPlace = (place) => {
  const text = getPlaceText(place);
  return ['khach san', 'hotel', 'homestay', 'resort', 'nha nghi', 'villa', 'noi luu tru'].some((keyword) =>
    text.includes(keyword)
  );
};

const isFoodPlace = (place) => {
  const text = getPlaceText(place);
  return ['am thuc', 'an uong', 'quan an', 'nha hang', 'cafe', 'ca phe', 'hai san', 'cho dem'].some(
    (keyword) => text.includes(keyword)
  );
};

const parsePrice = (value) => {
  const normalized = normalizeText(value);
  if (!normalized || normalized.includes('mien phi') || normalized.includes('da gom')) return 0;

  const matches = Array.from(String(value || '').matchAll(/(\d[\d.,]*)\s*(k|nghin|ngan)?/gi));
  const prices = matches
    .map((match) => {
      const amount = Number(match[1].replace(/[.,]/g, ''));
      return normalizeText(match[2]) ? amount * 1000 : amount;
    })
    .filter((amount) => Number.isFinite(amount) && amount >= 0);

  return prices.length ? Math.min(...prices) : 0;
};

const matchesDestination = (place, destination) => {
  const normalizedDestination = normalizeText(destination);
  const text = getPlaceText(place);

  if (text.includes(normalizedDestination)) return true;

  const aliasKey = Object.keys(DESTINATION_ALIASES).find(
    (key) => normalizedDestination.includes(key) || key.includes(normalizedDestination)
  );
  return aliasKey ? DESTINATION_ALIASES[aliasKey].some((alias) => text.includes(alias)) : false;
};

const getActivityType = (place) => {
  const text = getPlaceText(place);
  if (isFoodPlace(place)) return 'Ăn uống';
  if (['mua sam', 'cho', 'qua luu niem'].some((keyword) => text.includes(keyword))) return 'Mua sắm';
  if (['thu gian', 'nghi ngoi', 'ho ', 'bien', 'bai '].some((keyword) => text.includes(keyword))) return 'Thư giãn';
  if (['van hoa', 'lich su', 'bao tang', 'chua', 'den', 'pho co', 'di tich'].some((keyword) => text.includes(keyword))) {
    return 'Văn hóa';
  }
  if (['cap treo', 'trek', 'leo', 'thuyen thung', 'vui choi'].some((keyword) => text.includes(keyword))) return 'Trải nghiệm';
  return 'Tham quan';
};

const getInterestScore = (place, interests) => {
  const text = getPlaceText(place);
  return interests.reduce((score, interest) => {
    const matched = (INTEREST_KEYWORDS[interest] || []).some((keyword) => text.includes(keyword));
    return score + (matched ? 30 : 0);
  }, 0);
};

const scorePlace = (place, { interests, perPersonDailyBudget, people }) => {
  const price = parsePrice(place.ticketPrice);
  const rating = Number(place.rating || 4);
  const costScore =
    perPersonDailyBudget <= 0 || price === 0
      ? 12
      : price <= perPersonDailyBudget * 0.35
        ? 20
        : price <= perPersonDailyBudget * 0.7
          ? 12
          : price <= perPersonDailyBudget
            ? 4
            : -18;
  const groupScore = people >= 4 && (isFoodPlace(place) || getActivityType(place) === 'Trải nghiệm') ? 6 : 0;
  return getInterestScore(place, interests) + rating * 2 + costScore + groupScore;
};

const getActivityCount = ({ dayIndex, days, interests, people, budget }) => {
  const perPersonPerDay = Number(budget || 0) / Math.max(days * people, 1);
  const shouldAddSeventhPoint =
    perPersonPerDay >= 300000 ||
    interests.length >= 3 ||
    people >= 4 ||
    (dayIndex + interests.length + people) % 2 === 0;

  return shouldAddSeventhPoint ? MAX_ACTIVITIES_PER_DAY : MIN_ACTIVITIES_PER_DAY;
};

const toDateOnly = (value) => new Date(`${value}T00:00:00.000Z`);

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const haversineDistance = (from, to) => {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return null;
  const earthRadiusKm = 6371;
  const radians = (value) => (value * Math.PI) / 180;
  const dLat = radians(to.lat - from.lat);
  const dLng = radians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getSuggestedTransport = (previousPlace, place) => {
  if (!previousPlace) return 'Tự di chuyển đến điểm hẹn';
  const distance = haversineDistance(previousPlace.coordinates, place.coordinates);
  if (distance === null) return 'Xe máy hoặc taxi';
  if (distance <= 1.5) return 'Đi bộ';
  if (distance <= 6) return 'Xe máy hoặc taxi';
  return 'Ô tô hoặc taxi';
};

const getShortDescription = (place, activityType) => {
  const firstSentence = String(place.introduction || '').split(/(?<=[.!?])\s/)[0]?.trim();
  return firstSentence || `${activityType} tại ${place.name}.`;
};

const choosePlacesForDay = ({ rankedPlaces, count, dayIndex }) => {
  const foodPlaces = rankedPlaces.filter(isFoodPlace);
  const otherPlaces = rankedPlaces.filter((place) => !isFoodPlace(place));
  const chosen = [];

  if (foodPlaces.length && count >= 3) {
    chosen.push(foodPlaces[dayIndex % foodPlaces.length]);
  }

  const primaryPool = otherPlaces.length ? otherPlaces : rankedPlaces;
  let cursor = dayIndex;
  while (chosen.length < count && primaryPool.length) {
    const candidate = primaryPool[cursor % primaryPool.length];
    if (!chosen.some((place) => place.name === candidate.name)) chosen.push(candidate);
    cursor += 1;
    if (cursor - dayIndex > primaryPool.length * 2) break;
  }

  cursor = dayIndex;
  while (chosen.length < count && rankedPlaces.length) {
    const candidate = rankedPlaces[cursor % rankedPlaces.length];
    if (!chosen.some((place) => place.name === candidate.name)) chosen.push(candidate);
    cursor += 1;
    if (cursor - dayIndex > rankedPlaces.length * 2) break;
  }

  return chosen;
};

const buildPreviewFromPlaces = (input, places) => {
  const days = Math.floor((toDateOnly(input.endDate) - toDateOnly(input.startDate)) / 86400000) + 1;
  const people = Number(input.people);
  const budget = Number(input.budget || 0);
  const interests = Array.isArray(input.interests) ? input.interests : [];
  const candidates = places.filter((place) => !isStayPlace(place) && matchesDestination(place, input.destination));

  if (!candidates.length) {
    const error = new Error(`Không tìm thấy địa điểm phù hợp tại ${input.destination}.`);
    error.code = 'NO_MATCHING_PLACES';
    throw error;
  }

  if (candidates.length < MIN_ACTIVITIES_PER_DAY) {
    const error = new Error(
      `Chưa có đủ ít nhất ${MIN_ACTIVITIES_PER_DAY} địa điểm phù hợp tại ${input.destination} để tạo lịch trình trong ngày.`
    );
    error.code = 'INSUFFICIENT_PLACES';
    throw error;
  }

  const perPersonDailyBudget = budget / Math.max(days * people, 1);
  const rankedPlaces = [...candidates].sort(
    (a, b) =>
      scorePlace(b, { interests, perPersonDailyBudget, people }) -
      scorePlace(a, { interests, perPersonDailyBudget, people })
  );

  const startDate = toDateOnly(input.startDate);
  const itineraryDays = Array.from({ length: days }, (_, dayIndex) => {
    const activityCount = Math.min(
      getActivityCount({ dayIndex, days, interests, people, budget }),
      candidates.length
    );
    const dayPlaces = choosePlacesForDay({ rankedPlaces, count: activityCount, dayIndex });
    const slots = TIME_SLOTS[dayPlaces.length] || TIME_SLOTS[MIN_ACTIVITIES_PER_DAY];
    let previousPlace;
    const activities = dayPlaces.map((place, index) => {
      const estimatedCostPerPerson = parsePrice(place.ticketPrice);
      const activity = {
        timeSlot: slots[index],
        place: place.name,
        address: place.address || '',
        description: getShortDescription(place, getActivityType(place)),
        estimatedCost: estimatedCostPerPerson * people,
        estimatedCostPerPerson,
        activityType: getActivityType(place),
        suggestedTransport: getSuggestedTransport(previousPlace, place),
      };
      previousPlace = place;
      return activity;
    });

    return {
      day: dayIndex + 1,
      date: formatDate(addDays(startDate, dayIndex)),
      title: `Ngày ${dayIndex + 1} tại ${input.destination}`,
      activities,
    };
  });

  const estimatedTotalCost = itineraryDays
    .flatMap((day) => day.activities)
    .reduce((total, activity) => total + activity.estimatedCost, 0);

  return {
    isPreview: true,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    people,
    budget,
    interests,
    estimatedTotalCost,
    budgetMessage:
      budget > 0 && estimatedTotalCost > budget
        ? 'Chi phí hoạt động ước tính đang vượt ngân sách bạn đã nhập. Bạn có thể giảm số ngày, số người hoặc chọn ngân sách cao hơn.'
        : 'Chi phí là ước tính cho các hoạt động trong gợi ý, chưa bao gồm các khoản phát sinh.',
    days: itineraryDays,
  };
};

const generateItineraryPreview = async (input) => {
  const places = await Place.find({}).lean();
  return buildPreviewFromPlaces(input, places);
};

module.exports = {
  generateItineraryPreview,
  __testables: {
    buildPreviewFromPlaces,
    getActivityCount,
    matchesDestination,
    parsePrice,
  },
};
