const Place = require('../models/Place');

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Ä‘/g, 'd')
    .trim()
    .replace(/\s+/g, ' ');

const roundToNearest = (value, step = 1000) =>
  Math.max(0, Math.round(Number(value || 0) / step) * step);

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const uniquePlacesById = (places = []) => {
  const seen = new Set();
  return places.filter((place) => {
    const key = place._id?.toString() || place.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getBudgetPlan = (budget, durationDays) => {
  const totalBudget = Number(budget || 0);
  const days = Math.max(Number(durationDays || 1), 1);

  if (!totalBudget) {
    return {
      totalBudget,
      accommodation: 0,
      foodAndBeverage: 0,
      activitiesAndEntranceFees: 0,
      transportation: 0,
      unforeseenExpenses: 0,
      days,
    };
  }

  return {
    totalBudget,
    accommodation: Math.round(totalBudget * 0.35),
    foodAndBeverage: Math.round(totalBudget * 0.3),
    activitiesAndEntranceFees: Math.round(totalBudget * 0.25),
    transportation: Math.round(totalBudget * 0.05),
    unforeseenExpenses: Math.round(totalBudget * 0.05),
    days,
  };
};

const calculateBudgetBreakdown = (result, budget, durationDays) => {
  const activities = (result.itinerary || []).flatMap((day) => day.activities || []);
  const sumByCategory = (categories) =>
    activities
      .filter((activity) => categories.includes((activity.category || '').toUpperCase()))
      .reduce((sum, activity) => sum + Number(activity.cost || 0), 0);

  const accommodation =
    Number(result.hotelRecommendation?.estimatedCostPerNight || 0) * Number(durationDays || 1);
  const foodAndBeverage = sumByCategory(['FOOD']);
  const transportation = sumByCategory(['TRANSPORT']);
  const activitiesAndEntranceFees = sumByCategory(['PLACE', 'REST', 'SHOPPING', 'OTHER']);
  const used = accommodation + foodAndBeverage + transportation + activitiesAndEntranceFees;

  return {
    accommodation,
    foodAndBeverage,
    activitiesAndEntranceFees,
    transportation,
    unforeseenExpenses: Math.max(Number(budget || 0) - used, 0),
  };
};

const STYLE_KEYWORDS = {
  FOOD: [
    'am thuc',
    'an uong',
    'mon an',
    'quan an',
    'quan com',
    'quan hai san',
    'nha hang',
    'hai san',
    'cho dem',
    'mi quang',
    'banh trang',
    'bun',
    'cafe',
  ],
  BEACH: ['bien', 'bai tam', 'dao', 'ban dao', 'my khe', 'pham van dong', 'son tra'],
  CULTURE: ['van hoa', 'chua', 'bao tang', 'di tich', 'pho co', 'cau', 'lang', 'tam linh'],
  NATURE: ['thien nhien', 'nui', 'rung', 'suoi', 'deo', 'son tra', 'ngu hanh son', 'hoa phu'],
};

const STYLE_CATEGORY = {
  FOOD: 'FOOD',
  BEACH: 'REST',
  CULTURE: 'PLACE',
  NATURE: 'PLACE',
};

const TIME_SLOT_PATTERNS = [
  ['07:30', '09:30', '11:30', '13:30', '15:30', '17:30', '19:30'],
  ['08:00', '10:00', '12:00', '14:30', '16:30', '18:30', '20:00'],
  ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
];

const getDailyActivityCount = ({ budgetPlan, preferredStyles, people }) => {
  const dailyBudget =
    (Number(budgetPlan.foodAndBeverage || 0) +
      Number(budgetPlan.activitiesAndEntranceFees || 0)) /
    Math.max(Number(budgetPlan.days || 1), 1);
  const perPersonDailyBudget = dailyBudget / Math.max(Number(people || 1), 1);

  if (perPersonDailyBudget && perPersonDailyBudget < 180000) return randomInt(4, 5);
  if (perPersonDailyBudget && perPersonDailyBudget < 350000) return randomInt(4, 5);
  if (preferredStyles.includes('FOOD')) return randomInt(5, 7);
  if (perPersonDailyBudget > 700000) return randomInt(5, 7);
  return randomInt(4, 6);
};

const shiftTime = (time, minutes) => {
  const [hour, minute] = String(time || '08:00').split(':').map(Number);
  const totalMinutes = Math.max(0, hour * 60 + minute + minutes);
  const nextHour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const nextMinute = String(totalMinutes % 60).padStart(2, '0');
  return `${nextHour}:${nextMinute}`;
};

const getActivityTime = ({ dayIndex, index, dailyCount }) => {
  const pattern = TIME_SLOT_PATTERNS[dayIndex % TIME_SLOT_PATTERNS.length];
  if (dailyCount <= 3) {
    const compactPatterns = [
      ['08:00', '13:30', '18:00'],
      ['08:30', '12:00', '16:30'],
      ['09:00', '14:00', '19:00'],
    ];
    const baseTime = compactPatterns[dayIndex % compactPatterns.length][index] || '15:00';
    return shiftTime(baseTime, randomInt(-1, 1) * 15);
  }

  return shiftTime(pattern[index] || '18:30', randomInt(-1, 1) * 15);
};

const getPreferredTravelStyles = (options = {}) => {
  const raw = normalizeText(`${options.travelStyle || ''} ${options.interests || ''}`);
  const styles = ['FOOD', 'BEACH', 'CULTURE', 'NATURE'].filter((style) => {
    const codeMatched = raw.includes(style.toLowerCase());
    const keywordMatched = (STYLE_KEYWORDS[style] || []).some((keyword) => raw.includes(keyword));
    return codeMatched || keywordMatched;
  });
  return styles.length ? styles : ['BEACH'];
};

const getPlaceText = (place) =>
  normalizeText(
    [
      place.name,
      place.category,
      place.address,
      place.introduction,
      place.ticketPrice,
      place.openHours,
    ]
      .filter(Boolean)
      .join(' ')
  );

const parsePriceNumber = (value) => {
  const text = normalizeText(value);
  if (!text || text.includes('mien phi') || text.includes('free')) return 0;

  const matches = Array.from(String(value || '').matchAll(/(\d[\d.,]*)\s*(k|nghin|ngan)?/gi));
  if (!matches.length) return null;

  const numbers = matches
    .map((match) => {
      const number = Number(match[1].replace(/[.,]/g, ''));
      const suffix = normalizeText(match[2] || '');
      return suffix ? number * 1000 : number;
    })
    .filter(Number.isFinite);

  return numbers.length ? Math.max(...numbers) : null;
};

const getPlaceStyleScore = (place, preferredStyles) => {
  const text = getPlaceText(place);
  return preferredStyles.reduce((score, style) => {
    const matchedCount = (STYLE_KEYWORDS[style] || []).filter((keyword) =>
      text.includes(keyword)
    ).length;
    return score + matchedCount * (style === 'FOOD' ? 5 : 3);
  }, 0);
};

const isDestinationMatch = (place, destination) => {
  const destinationText = normalizeText(destination);
  if (!destinationText) return true;

  const text = getPlaceText(place);
  return text.includes(destinationText) || destinationText.includes('da nang');
};

const hasUsableCoordinates = (place) => {
  const lat = Number(place?.coordinates?.lat);
  const lng = Number(place?.coordinates?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  // Mongo schema default / Da Nang center fallback, not a real place coordinate.
  const isDefaultDaNangCenter =
    Math.abs(lat - 16.0544) < 0.0002 && Math.abs(lng - 108.2022) < 0.0002;
  return !isDefaultDaNangCenter;
};

const getBudgetTargetForPlace = (place, preferredStyles, budgetPlan, durationDays) => {
  const category = getActivityCategory(place, preferredStyles);
  const days = Math.max(Number(durationDays || 1), 1);
  const perDayActivityBudget = Math.floor(
    Number(budgetPlan.activitiesAndEntranceFees || 0) / days
  );
  const plannedActivityStops = preferredStyles.includes('FOOD') ? 3 : 2;
  const perActivityBudget = Math.floor(perDayActivityBudget / plannedActivityStops);
  const perMealBudget = Math.floor(
    Number(budgetPlan.foodAndBeverage || 0) /
      Math.max(days * (preferredStyles.includes('FOOD') ? 3 : 2), 1)
  );

  return category === 'FOOD' ? perMealBudget : perActivityBudget || perDayActivityBudget;
};

const getPlaceTotalCost = (place, people, preferredStyles) => {
  const rawCostPerPerson = parsePriceNumber(place.ticketPrice);
  if (rawCostPerPerson === null) return null;
  if (rawCostPerPerson === 0 && getActivityCategory(place, preferredStyles) === 'FOOD') {
    return null;
  }

  return rawCostPerPerson * Math.max(Number(people || 1), 1);
};

const getPlaceBudgetScore = (place, preferredStyles, budgetPlan, durationDays, people) => {
  const targetCost = getBudgetTargetForPlace(place, preferredStyles, budgetPlan, durationDays);
  const totalCost = getPlaceTotalCost(place, people, preferredStyles);

  if (!targetCost || totalCost === null) return 1;
  if (totalCost === 0) return 2;

  const ratio = totalCost / targetCost;
  if (ratio <= 0.7) return 2;
  if (ratio <= 1) return 1.5;
  if (ratio <= 1.3) return 0.5;
  return -5;
};

const isPlaceWithinBudget = (place, preferredStyles, budgetPlan, durationDays, people) => {
  const targetCost = getBudgetTargetForPlace(place, preferredStyles, budgetPlan, durationDays);
  const totalCost = getPlaceTotalCost(place, people, preferredStyles);

  if (!targetCost || totalCost === null || totalCost === 0) return true;
  return totalCost <= targetCost;
};

const shuffleWeightedPlaces = (places, preferredStyles, budgetPlan, durationDays, people) =>
  [...places]
    .map((place) => ({
      place,
      score:
        getPlaceStyleScore(place, preferredStyles) +
        getPlaceBudgetScore(place, preferredStyles, budgetPlan, durationDays, people) +
        (preferredStyles.length === 1 &&
        preferredStyles.includes('FOOD') &&
        getActivityCategory(place, preferredStyles) === 'FOOD'
          ? 6
          : 0) +
        Number(place.rating || 4) / 5 +
        Math.random() * 4,
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.place);

const pickPlaces = async (destination, preferredStyles, count, budgetPlan, durationDays, people) => {
  const allPlaces = await Place.find({}).lean();
  const coordinatePlaces = allPlaces.filter(hasUsableCoordinates);
  const candidatePlaces = coordinatePlaces.length >= Math.min(count, 3) ? coordinatePlaces : allPlaces;
  const destinationPlaces = candidatePlaces.filter((place) => isDestinationMatch(place, destination));
  const sourcePlaces = destinationPlaces.length ? destinationPlaces : candidatePlaces;
  const budgetMatches = sourcePlaces.filter((place) =>
    isPlaceWithinBudget(place, preferredStyles, budgetPlan, durationDays, people)
  );
  const budgetSource =
    budgetMatches.length >= Math.min(count, 4)
      ? budgetMatches
      : uniquePlacesById([...budgetMatches, ...sourcePlaces]);

  const styleMatches = budgetSource.filter((place) => getPlaceStyleScore(place, preferredStyles) > 0);
  let mixedPlaces =
    styleMatches.length >= Math.min(count, 4)
      ? styleMatches
      : uniquePlacesById([...styleMatches, ...budgetSource]);
  const needsNonFoodMix = getNonFoodStyles(preferredStyles).length > 0;
  const nonFoodMatches = mixedPlaces.filter(
    (place) => getActivityCategory(place, preferredStyles) !== 'FOOD'
  );

  if (needsNonFoodMix && nonFoodMatches.length < Math.min(3, count - 1)) {
    mixedPlaces = uniquePlacesById([
      ...nonFoodMatches,
      ...budgetSource.filter((place) => getActivityCategory(place, preferredStyles) !== 'FOOD'),
      ...mixedPlaces,
      ...budgetSource,
    ]);
  }

  if (!mixedPlaces.length) {
    return [];
  }

  const weightedMixedPlaces = shuffleWeightedPlaces(
    mixedPlaces,
    preferredStyles,
    budgetPlan,
    durationDays,
    people
  );
  const maxCandidateCount = Math.max(count * 3, count + 10);
  const nonFoodCandidates = weightedMixedPlaces.filter(
    (place) => getActivityCategory(place, preferredStyles) !== 'FOOD'
  );
  const foodCandidates = weightedMixedPlaces.filter(
    (place) => getActivityCategory(place, preferredStyles) === 'FOOD'
  );

  return uniquePlacesById([
    ...nonFoodCandidates.slice(0, maxCandidateCount),
    ...foodCandidates.slice(0, maxCandidateCount),
    ...weightedMixedPlaces.slice(0, maxCandidateCount),
  ]);
};

const getActivityCategory = (place, preferredStyles) => {
  const text = getPlaceText(place);
  const foodMatched = (STYLE_KEYWORDS.FOOD || []).some((keyword) => text.includes(keyword));
  if (foodMatched) return 'FOOD';

  const matchedStyle = preferredStyles.find((style) =>
    (STYLE_KEYWORDS[style] || []).some((keyword) => text.includes(keyword))
  );

  return STYLE_CATEGORY[matchedStyle] || 'PLACE';
};

const getPlaceKey = (place) => place?._id?.toString() || place?.name;

const getNonFoodStyles = (preferredStyles) =>
  preferredStyles.filter((style) => style !== 'FOOD');

const pickFromPool = (pool, usedKeys) => {
  if (!pool.length) return null;

  let index = pool.findIndex((place) => !usedKeys.has(getPlaceKey(place)));
  if (index < 0) index = 0;

  const [picked] = pool.splice(index, 1);
  const key = getPlaceKey(picked);
  if (key) usedKeys.add(key);
  return picked;
};

const buildDayStyleSlots = (preferredStyles, dailyCount, dayIndex) => {
  const nonFoodStyles = getNonFoodStyles(preferredStyles);
  const hasFood = preferredStyles.includes('FOOD');

  if (!hasFood) {
    return Array.from(
      { length: dailyCount },
      (_, index) => nonFoodStyles[(index + dayIndex) % Math.max(nonFoodStyles.length, 1)] || 'OTHER'
    );
  }

  const maxFoodStops = nonFoodStyles.length
    ? Math.max(1, Math.min(Math.ceil(dailyCount * 0.4), dailyCount - 1))
    : Math.max(2, Math.min(Math.ceil(dailyCount * 0.55), dailyCount - 1));
  let foodStops = 0;
  let nonFoodCursor = dayIndex;

  return Array.from({ length: dailyCount }, (_, index) => {
    const remainingSlots = dailyCount - index;
    const remainingFood = maxFoodStops - foodStops;
    const shouldUseFood =
      remainingFood > 0 && (index === 1 || index === 3 || remainingSlots <= remainingFood);

    if (shouldUseFood) {
      foodStops += 1;
      return 'FOOD';
    }

    const style = nonFoodStyles[nonFoodCursor % Math.max(nonFoodStyles.length, 1)] || 'OTHER';
    nonFoodCursor += 1;
    return style;
  });
};

const pickDayPlaces = ({ places, preferredStyles, dailyCount, dayIndex, usedKeys }) => {
  const shuffled = shuffleWeightedPlaces(
    places,
    preferredStyles,
    { days: 1, foodAndBeverage: 0, activitiesAndEntranceFees: 0 },
    1,
    1
  );
  const pools = {
    FOOD: shuffled.filter((place) => getActivityCategory(place, preferredStyles) === 'FOOD'),
    OTHER: shuffled.filter((place) => getActivityCategory(place, preferredStyles) !== 'FOOD'),
  };

  getNonFoodStyles(preferredStyles).forEach((style) => {
    pools[style] = shuffled.filter(
      (place) =>
        getActivityCategory(place, preferredStyles) !== 'FOOD' &&
        getPlaceStyleScore(place, [style]) > 0
    );
  });

  return buildDayStyleSlots(preferredStyles, dailyCount, dayIndex)
    .map((slot) => {
      const fallbackPool = slot === 'FOOD' ? pools.OTHER : pools.OTHER;
      return (
        pickFromPool(pools[slot] || [], usedKeys) ||
        pickFromPool(fallbackPool, usedKeys) ||
        pickFromPool(shuffled, usedKeys)
      );
    })
    .filter(Boolean);
};

const getPlaceDescription = (place) => {
  const intro = String(place.introduction || '').split('.').find(Boolean);
  if (intro) return intro.trim();
  return `Khám phá ${place.name} trong lịch trình của bạn.`;
};

const parseDurationMinutes = (value, fallback) => {
  const text = normalizeText(value);
  const matches = text.match(/\d+/g);
  if (!matches?.length) return fallback;

  const numbers = matches.map(Number).filter(Number.isFinite);
  if (!numbers.length) return fallback;

  const average = numbers.reduce((sum, item) => sum + item, 0) / numbers.length;
  const parsed = text.includes('ngay') || text.includes('dem')
    ? Math.round(average * 360)
    : text.includes('gio')
      ? Math.round(average * 60)
      : Math.round(average);

  return Math.min(Math.max(parsed, 30), 240);
};

const createPlaceActivity = ({
  place,
  preferredStyles,
  index,
  dayIndex,
  dailyCount,
  budgetPlan,
  durationDays,
  people,
}) => {
  const category = getActivityCategory(place, preferredStyles);
  const rawCostPerPerson = parsePriceNumber(place.ticketPrice);
  const partySize = Math.max(Number(people || 1), 1);
  const days = Math.max(Number(durationDays || 1), 1);
  const perDayActivityBudget = Math.floor(
    Number(budgetPlan.activitiesAndEntranceFees || 0) / days
  );
  const plannedFoodStops = preferredStyles.includes('FOOD')
    ? Math.max(2, Math.ceil(dailyCount * 0.55))
    : Math.min(2, dailyCount);
  const plannedActivityStops = Math.max(dailyCount - plannedFoodStops, 1);
  const perActivityBudget = Math.floor(perDayActivityBudget / plannedActivityStops);
  const perMealBudget = Math.floor(
    Number(budgetPlan.foodAndBeverage || 0) / Math.max(days * plannedFoodStops, 1)
  );
  const targetCost = category === 'FOOD' ? perMealBudget : perActivityBudget || perDayActivityBudget;
  const rawTotalCost =
    rawCostPerPerson === null || (category === 'FOOD' && rawCostPerPerson === 0)
      ? null
      : rawCostPerPerson * partySize;
  const cost = rawTotalCost === null ? targetCost : rawTotalCost;

  return {
    placeId: place._id?.toString(),
    time: getActivityTime({ dayIndex, index, dailyCount }),
    location: place.name,
    address: place.address || '',
    coordinates: place.coordinates,
    description: getPlaceDescription(place),
    cost: roundToNearest(cost, 10000),
    category,
    transport: index === 0 ? 'GRAB' : 'MOTORBIKE',
    durationMinutes: parseDurationMinutes(place.duration, category === 'FOOD' ? 60 : 90),
  };
};

const generateItinerary = async (
  destination,
  durationDays,
  budget,
  preferences = [],
  options = {}
) => {
  const days = Number(durationDays);
  if (!days || days < 1) {
    throw new Error('durationDays must be at least 1');
  }

  const startDate = options.startDate || new Date().toISOString().split('T')[0];
  const people = Number(options.people || 1);
  const preferredStyles = getPreferredTravelStyles(options);
  const budgetPlan = getBudgetPlan(budget, days);
  const dailyActivityCounts = Array.from({ length: days }, (_, dayIndex) =>
    getDailyActivityCount({ dayIndex, budgetPlan, preferredStyles, people })
  );
  const neededPlaces = dailyActivityCounts.reduce((sum, count) => sum + count, 0);
  const places = await pickPlaces(
    destination,
    preferredStyles,
    neededPlaces,
    budgetPlan,
    days,
    people
  );

  if (!places.length) {
    throw new Error(`Khong co dia diem nao trong bang places cho "${destination}".`);
  }

  const usedPlaceKeys = new Set();
  const itinerary = Array.from({ length: days }, (_, dayIndex) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const dailyCount = dailyActivityCounts[dayIndex] || 3;
    const dayPlaces = pickDayPlaces({
      places,
      preferredStyles,
      dailyCount,
      dayIndex,
      usedKeys: usedPlaceKeys,
    });

    return {
      day: dayIndex + 1,
      date: date.toISOString().split('T')[0],
      theme: `Khám phá ${destination} theo sở thích`,
      sourceStyle: preferredStyles.join('+'),
      activities: dayPlaces.map((place, index) =>
        createPlaceActivity({
          place,
          preferredStyles,
          index,
          dayIndex,
          dailyCount,
          budgetPlan,
          durationDays: days,
          people,
        })
      ),
    };
  });

  const restaurants = places
    .filter((place) => getActivityCategory(place, preferredStyles) === 'FOOD')
    .slice(0, 5)
    .map((place) => ({
      name: place.name,
      cuisineType: 'Ẩm thực địa phương',
      averagePricePerPerson: Math.max(parsePriceNumber(place.ticketPrice) || 0, 50000),
      rating: place.rating || 4.5,
      address: place.address || '',
      description: getPlaceDescription(place),
    }));

  const result = {
    destination,
    startDate,
    days,
    people,
    budget: Number(budget || 0),
    travelStyle: options.travelStyle || preferences.join(', ') || preferredStyles.join(', '),
    interests: options.interests || preferences.join(', ') || '',
    hotelArea: options.hotelArea || 'Trung tâm',
    aiProvider: 'places-random',
    templateStyles: preferredStyles,
    hotelRecommendation: {
      name: `Khách sạn khu vực ${destination}`,
      address: options.hotelArea || `Trung tâm ${destination}`,
      description: 'Gợi ý lưu trú gần các điểm trong lịch trình.',
      estimatedCostPerNight: roundToNearest(
        Math.floor(Number(budgetPlan.accommodation || 0) / Math.max(days, 1)),
        10000
      ),
    },
    restaurantRecommendations: restaurants,
    itinerary,
  };

  result.budgetBreakdown = calculateBudgetBreakdown(result, budget, days);
  console.log(`Generated itinerary from places collection for "${destination}".`);
  return result;
};

module.exports = {
  generateItinerary,
};
