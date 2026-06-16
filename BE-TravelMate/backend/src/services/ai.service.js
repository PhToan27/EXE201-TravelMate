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

const getBudgetPlan = (budget, durationDays) => {
  const totalBudget = Number(budget || 0);
  const days = Math.max(Number(durationDays || 1), 1);

  if (!totalBudget) {
    return {
      accommodation: 0,
      foodAndBeverage: 0,
      activitiesAndEntranceFees: 0,
      transportation: 0,
      unforeseenExpenses: 0,
      days,
    };
  }

  return {
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

const TIME_SLOTS = ['08:00', '10:30', '14:30', '18:00'];

const getPreferredTravelStyles = (options = {}) => {
  const raw = normalizeText(`${options.travelStyle || ''} ${options.interests || ''}`).toUpperCase();
  const styles = ['FOOD', 'BEACH', 'CULTURE', 'NATURE'].filter((style) => raw.includes(style));
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
    return score + matchedCount * 3;
  }, 0);
};

const isDestinationMatch = (place, destination) => {
  const destinationText = normalizeText(destination);
  if (!destinationText) return true;

  const text = getPlaceText(place);
  return text.includes(destinationText) || destinationText.includes('da nang');
};

const getBudgetTargetForPlace = (place, preferredStyles, budgetPlan, durationDays) => {
  const category = getActivityCategory(place, preferredStyles);
  const days = Math.max(Number(durationDays || 1), 1);
  const perDayActivityBudget = Math.floor(
    Number(budgetPlan.activitiesAndEntranceFees || 0) / days
  );
  const perActivityBudget = Math.floor(perDayActivityBudget / 2);
  const perMealBudget = Math.floor(
    Number(budgetPlan.foodAndBeverage || 0) / Math.max(days * 2, 1)
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
  return totalCost <= targetCost * 1.3;
};

const shuffleWeightedPlaces = (places, preferredStyles, budgetPlan, durationDays, people) =>
  [...places]
    .map((place) => ({
      place,
      score:
        getPlaceStyleScore(place, preferredStyles) +
        getPlaceBudgetScore(place, preferredStyles, budgetPlan, durationDays, people) +
        Number(place.rating || 4) / 5 +
        Math.random() * 4,
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.place);

const pickPlaces = async (destination, preferredStyles, count, budgetPlan, durationDays, people) => {
  const allPlaces = await Place.find({}).lean();
  const destinationPlaces = allPlaces.filter((place) => isDestinationMatch(place, destination));
  const sourcePlaces = destinationPlaces.length ? destinationPlaces : allPlaces;
  const budgetMatches = sourcePlaces.filter((place) =>
    isPlaceWithinBudget(place, preferredStyles, budgetPlan, durationDays, people)
  );
  const budgetSource = budgetMatches.length >= Math.min(count, 3) ? budgetMatches : sourcePlaces;

  const styleMatches = budgetSource.filter((place) => getPlaceStyleScore(place, preferredStyles) > 0);
  const mixedPlaces = styleMatches.length >= Math.min(count, 3) ? styleMatches : budgetSource;

  if (!mixedPlaces.length) {
    return [];
  }

  const picked = [];
  let pool = shuffleWeightedPlaces(mixedPlaces, preferredStyles, budgetPlan, durationDays, people);

  while (picked.length < count) {
    if (!pool.length) {
      pool = shuffleWeightedPlaces(mixedPlaces, preferredStyles, budgetPlan, durationDays, people);
    }
    picked.push(pool.shift());
  }

  return picked;
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

const getPlaceDescription = (place) => {
  const intro = String(place.introduction || '').split('.').find(Boolean);
  if (intro) return intro.trim();
  return `Khám phá ${place.name} trong lịch trình của bạn.`;
};

const createPlaceActivity = ({
  place,
  preferredStyles,
  index,
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
  const perActivityBudget = Math.floor(perDayActivityBudget / 2);
  const perMealBudget = Math.floor(
    Number(budgetPlan.foodAndBeverage || 0) / Math.max(days * 2, 1)
  );
  const targetCost = category === 'FOOD' ? perMealBudget : perActivityBudget || perDayActivityBudget;
  const rawTotalCost =
    rawCostPerPerson === null || (category === 'FOOD' && rawCostPerPerson === 0)
      ? null
      : rawCostPerPerson * partySize;
  const cost = targetCost
    ? rawTotalCost === null
      ? targetCost
      : Math.min(rawTotalCost, targetCost)
    : rawTotalCost || 0;

  return {
    placeId: place._id?.toString(),
    time: TIME_SLOTS[index] || '15:00',
    location: place.name,
    address: place.address || '',
    coordinates: place.coordinates,
    description: getPlaceDescription(place),
    cost: roundToNearest(cost, 10000),
    category,
    transport: index === 0 ? 'GRAB' : 'MOTORBIKE',
    durationMinutes: category === 'FOOD' ? 60 : 90,
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
  const activitiesPerDay = 3;
  const neededPlaces = days * activitiesPerDay;
  const budgetPlan = getBudgetPlan(budget, days);
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

  const itinerary = Array.from({ length: days }, (_, dayIndex) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const dayPlaces = places.slice(
      dayIndex * activitiesPerDay,
      dayIndex * activitiesPerDay + activitiesPerDay
    );

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
