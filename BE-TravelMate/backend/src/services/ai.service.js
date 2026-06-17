const crypto = require('crypto');
const ItineraryCache = require('../models/ItineraryCache');
const ItineraryTemplate = require('../models/ItineraryTemplate');
const memoryCache = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeText = (value) =>
  String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');

const normalizeBudget = (budget) => {
  const value = Number(budget || 0);
  if (!value) return 0;

  // Gom ngân sách theo block 500k để cache dễ trúng hơn.
  return Math.round(value / 500000) * 500000;
};

const normalizePreferences = (preferences = []) => {
  if (!Array.isArray(preferences)) return [];

  return preferences
    .map(normalizeText)
    .filter(Boolean)
    .sort();
};

const normalizeOptions = (options = {}) => ({
  startDate: options.startDate || '',
  people: Number(options.people || 1),
  travelStyle: normalizeText(options.travelStyle || ''),
  interests: normalizeText(options.interests || ''),
  hotelArea: normalizeText(options.hotelArea || ''),
});

const getPreferredTravelStyles = (options = {}) => {
  const rawStyle = String(options.travelStyle || '').toUpperCase();
  const rawInterests = String(options.interests || '').toUpperCase();
  const raw = `${rawStyle},${rawInterests}`;
  const knownStyles = ['FOOD', 'BEACH', 'CULTURE', 'NATURE', 'ADVENTURE', 'CHILL', 'FAMILY', 'LUXURY', 'BUDGET'];
  const matchedStyles = knownStyles.filter((style) => raw.includes(style));

  return [...new Set([...matchedStyles, 'GENERAL'])];
};

const createCacheKey = (destination, durationDays, budget, preferences, options) => {
  const raw = JSON.stringify({
    destination: normalizeText(destination),
    durationDays: Number(durationDays),
    budget: normalizeBudget(budget),
    preferences: normalizePreferences(preferences),
    options: normalizeOptions(options),
  });

  return crypto.createHash('md5').update(raw).digest('hex');
};

const safeJsonParse = (text) => {
  const cleanText = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  return JSON.parse(cleanText);
};

const calculateBudgetBreakdown = (aiResult, budget, durationDays) => {
  const itinerary = aiResult.itinerary || [];
  const activities = itinerary.flatMap((day) => day.activities || []);

  const sumByCategory = (categories) =>
    activities
      .filter((activity) => categories.includes(activity.category))
      .reduce((sum, activity) => sum + Number(activity.cost || 0), 0);

  const accommodation =
    Number(aiResult.hotelRecommendation?.estimatedCostPerNight || 0) * Number(durationDays || 1);

  const foodAndBeverage = sumByCategory(['FOOD']);
  const transportation = sumByCategory(['TRANSPORT']);
  const activitiesAndEntranceFees = sumByCategory([
    'PLACE',
    'REST',
    'SHOPPING',
    'OTHER',
  ]);

  const used =
    accommodation +
    foodAndBeverage +
    transportation +
    activitiesAndEntranceFees;

  return {
    accommodation,
    foodAndBeverage,
    activitiesAndEntranceFees,
    transportation,
    unforeseenExpenses: Math.max(Number(budget || 0) - used, 0),
  };
};

const cloneJson = (value) => JSON.parse(JSON.stringify(value));

const roundToNearest = (value, step = 1000) => Math.max(0, Math.round(value / step) * step);

const getBudgetPlan = (budget, durationDays) => {
  const totalBudget = Number(budget || 0);
  const days = Math.max(Number(durationDays || 1), 1);

  if (!totalBudget) {
    return null;
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

const fitResultToBudget = (result, budget, durationDays) => {
  const plan = getBudgetPlan(budget, durationDays);

  if (!plan) {
    return result;
  }

  const fitted = cloneJson(result);
  const itinerary = Array.isArray(fitted.itinerary) ? fitted.itinerary : [];
  const activities = itinerary.flatMap((dayItem) => dayItem.activities || []);

  const scaleCategoryCosts = (categories, targetBudget) => {
    const matchedActivities = activities.filter((activity) =>
      categories.includes((activity.category || 'OTHER').toUpperCase())
    );

    const currentTotal = matchedActivities.reduce(
      (sum, activity) => sum + Number(activity.cost || 0),
      0
    );

    if (!matchedActivities.length || !currentTotal) {
      return;
    }

    const ratio = Math.min(targetBudget / currentTotal, 1);

    matchedActivities.forEach((activity) => {
      activity.cost = roundToNearest(Number(activity.cost || 0) * ratio);
    });
  };

  const accommodationPerNight = Math.floor(plan.accommodation / plan.days);
  if (fitted.hotelRecommendation) {
    fitted.hotelRecommendation.estimatedCostPerNight = roundToNearest(accommodationPerNight, 10000);
    fitted.hotelRecommendation.description =
      `${fitted.hotelRecommendation.description || 'Khách sạn phù hợp lịch trình.'} Mức giá đã cân theo ngân sách.`;
  }

  scaleCategoryCosts(['FOOD'], plan.foodAndBeverage);
  scaleCategoryCosts(['PLACE', 'REST', 'SHOPPING', 'OTHER'], plan.activitiesAndEntranceFees);
  scaleCategoryCosts(['TRANSPORT'], plan.transportation);

  if (Array.isArray(fitted.restaurantRecommendations) && fitted.restaurantRecommendations.length) {
    const mealBudget = Math.floor(plan.foodAndBeverage / Math.max(plan.days * 2, 1));
    fitted.restaurantRecommendations = fitted.restaurantRecommendations.map((restaurant) => ({
      ...restaurant,
      averagePricePerPerson: roundToNearest(
        Math.min(Number(restaurant.averagePricePerPerson || mealBudget), mealBudget),
        10000
      ),
      description: `${restaurant.description || 'Phù hợp lịch trình.'} Ưu tiên mức giá vừa ngân sách.`,
    }));
  }

  fitted.budgetBreakdown = calculateBudgetBreakdown(fitted, budget, durationDays);

  return fitted;
};

const mergeRestaurantRecommendations = (templates) => {
  const seenNames = new Set();

  return templates
    .flatMap((template) => template.result?.restaurantRecommendations || [])
    .filter((restaurant) => {
      const key = normalizeText(restaurant.name);
      if (!key || seenNames.has(key)) {
        return false;
      }

      seenNames.add(key);
      return true;
    })
    .slice(0, 5);
};

const composeTemplateDays = (templates, durationDays, startDate) => {
  const availableDays = templates.flatMap((template) =>
    (template.result?.itinerary || []).map((day) => ({
      sourceStyle: template.travelStyleKey,
      day,
    }))
  );

  if (!availableDays.length) {
    return [];
  }

  return Array.from({ length: Number(durationDays) }, (_, index) => {
    const source = availableDays[index % availableDays.length];
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);

    return {
      ...cloneJson(source.day),
      day: index + 1,
      date: date.toISOString().split('T')[0],
      sourceStyle: source.sourceStyle,
    };
  });
};

const findTemplateItinerary = async (
  destination,
  durationDays,
  budget,
  preferences = [],
  options = {}
) => {
  const destinationNorm = normalizeText(destination);
  const preferredStyles = getPreferredTravelStyles(options);

  const templates = await ItineraryTemplate.find({
    aliases: destinationNorm,
  }).lean();

  const matchedTemplates = preferredStyles
    .map((style) => templates.find((item) => item.travelStyleKey === style))
    .filter(Boolean);

  const selectedTemplates = matchedTemplates.length ? matchedTemplates : templates.slice(0, 1);

  if (!selectedTemplates.length) {
    return null;
  }

  console.log(
    `Using DB itinerary template for "${destination}" (${selectedTemplates
      .map((template) => template.travelStyleKey)
      .join('+')}).`
  );

  const startDate = options.startDate || new Date().toISOString().split('T')[0];
  const people = Number(options.people || 1);
  const travelStyle = options.travelStyle || preferences.join(', ') || 'tu tuc';
  const interests = options.interests || preferences.join(', ') || 'tham quan';
  const hotelArea = options.hotelArea || 'Trung tam';

  const primaryTemplate = selectedTemplates[0];
  const result = cloneJson(primaryTemplate.result);

  result.restaurantRecommendations = mergeRestaurantRecommendations(selectedTemplates);
  result.itinerary = composeTemplateDays(selectedTemplates, durationDays, startDate);

  result.destination = destination;
  result.startDate = startDate;
  result.days = Number(durationDays);
  result.people = people;
  result.budget = Number(budget || 0);
  result.travelStyle = travelStyle;
  result.interests = interests;
  result.hotelArea = hotelArea;
  result.aiProvider = 'database-template';
  result.templateStyles = selectedTemplates.map((template) => template.travelStyleKey);

  return fitResultToBudget(result, budget, durationDays);
};

const buildPrompt = ({
  destination,
  durationDays,
  budget,
  startDate,
  people,
  travelStyle,
  interests,
  hotelArea,
}) => {
  // Đa dạng hóa / Cá nhân hóa bằng cách chọn ngẫu nhiên góc tiếp cận lịch trình ngầm
  const approaches = [
    'Ưu tiên khám phá ẩm thực đường phố đặc sắc và nhịp sống sôi động về đêm.',
    'Ưu tiên lịch trình di chuyển thư thái, tối ưu hóa thời gian nghỉ ngơi và chọn các điểm gần nhau.',
    'Ưu tiên các hoạt động tìm hiểu văn hóa địa phương, lịch sử và check-in chụp ảnh cảnh quan đẹp.',
    'Ưu tiên các trải nghiệm khám phá thiên nhiên hoang sơ, hoạt động ngoài trời năng động và phiêu lưu.'
  ];
  const randomApproach = approaches[Math.floor(Math.random() * approaches.length)];

  return `
Return ONLY valid JSON. No markdown. No explanation.

Create a practical Vietnam travel itinerary.

Output language:
- JSON keys must stay exactly in English.
- All user-facing text values must be in Vietnamese.
- Place names should use Vietnamese names when available.

Input:
destination=${destination}
startDate=${startDate}
days=${durationDays}
people=${people}
budgetVND=${budget}
style=${travelStyle}
interests=${interests}
hotelArea=${hotelArea}
focusApproach=${randomApproach}

Rules:
- Exactly ${durationDays} days.
- 3 activities per day.
- Keep places in the same day geographically close.
- Costs are numbers in VND.
- Total estimated cost should fit the budget.
- Use these categories only: FOOD, PLACE, HOTEL, TRANSPORT, REST, SHOPPING, OTHER.
- Use these transports only: WALKING, BIKE, MOTORBIKE, CAR, BUS, TAXI, GRAB, OTHER.
- Keep descriptions short, max 20 words.
- Specific itinerary focus direction: ${randomApproach}

JSON shape:
{
  "hotelRecommendation": {
    "name": "",
    "address": "",
    "description": "",
    "estimatedCostPerNight": 0
  },
  "restaurantRecommendations": [
    {
      "name": "",
      "cuisineType": "",
      "averagePricePerPerson": 0,
      "rating": 0,
      "address": "",
      "description": ""
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "",
      "activities": [
        {
          "time": "08:00",
          "location": "",
          "description": "",
          "cost": 0,
          "category": "PLACE",
          "transport": "GRAB",
          "durationMinutes": 60
        }
      ]
    }
  ]
}
`;
};

/**
 * Helper to enrich the final itinerary with details of each place in bulk.
 * @param {Object} result - The itinerary result object containing `itinerary`
 * @returns {Promise<Object>} The enriched itinerary result object
 */
const enrichResultWithPlaceDetails = async (result) => {
  if (!result || !Array.isArray(result.itinerary)) {
    return result;
  }

  const activities = result.itinerary.flatMap((day) => day.activities || []);

  // Check if enrichment is actually needed (at least one activity has a location but lacks placeDetails)
  const needsEnrichment = activities.some((act) => act.location && !act.placeDetails);
  if (!needsEnrichment) {
    return result;
  }

  const locationNames = activities.map((act) => act.location).filter(Boolean);
  if (locationNames.length === 0) {
    return result;
  }

  try {
    const placeService = require('./place.service');
    const detailsMap = await placeService.getBulkPlacesDetails(locationNames);
    // Kiểm tra phòng vệ: Nếu detailsMap không phải là Map chuẩn (do lỗi import hoặc lỗi logic tầng dưới)
    if (!detailsMap || typeof detailsMap.get !== 'function') {
      console.error('detailsMap returned from placeService is invalid.');
      return result;
    }
    result.itinerary.forEach((day) => {
      if (Array.isArray(day.activities)) {
        day.activities.forEach((act) => {
          if (act.location) {
            const cleanLoc = act.location.toLowerCase().trim().normalize('NFC');
            const details = detailsMap.get(cleanLoc);
            if (details) {
              act.placeDetails = {
                name: details.name,
                category: details.category,
                rating: details.rating,
                reviewsCount: details.reviewsCount,
                duration: details.duration,
                difficulty: details.difficulty,
                introduction: details.introduction,
                address: details.address,
                openHours: details.openHours,
                ticketPrice: details.ticketPrice,
                imageUrl: details.imageUrl,
                coordinates: details.coordinates,
              };
              act.address = details.address;
              act.coordinates = details.coordinates;
            }
          }
        });
      }
    });
  } catch (err) {
    console.error('Failed to enrich itinerary with place details:', err.message);
  }

  return result;
};

const generateItinerary = async (
  destination,
  durationDays,
  budget,
  preferences = [],
  options = {}
) => {
  durationDays = Number(durationDays);

  if (!durationDays || durationDays < 1) {
    throw new Error('durationDays must be at least 1');
  }

  if (durationDays > 5) {
    throw new Error('Free AI plan only supports maximum 5 days per itinerary');
  }

  // 1. Check template cache first
  const templateResult = await findTemplateItinerary(
    destination,
    durationDays,
    budget,
    preferences,
    options
  );

  if (templateResult) {
    return await enrichResultWithPlaceDetails(templateResult);
  }

  // Lấy API Key của Groq
  const apiKey = process.env.GROQ_API_KEY || null;

  if (!apiKey) {
    console.warn('Missing GROQ_API_KEY. Using mock itinerary.');
    const mockRes = generateMockItinerary(destination, durationDays, budget, preferences, options);
    return await enrichResultWithPlaceDetails(mockRes);
  }

  const startDate = options.startDate || new Date().toISOString().split('T')[0];
  const people = Number(options.people || 1);
  const travelStyle =
    options.travelStyle || preferences.join(', ') || 'tự túc, tiết kiệm';
  const interests =
    options.interests || preferences.join(', ') || 'ẩm thực, văn hóa, ngắm cảnh';
  const hotelArea =
    options.hotelArea || 'trung tâm thành phố hoặc gần điểm du lịch chính';

  const cacheKey = createCacheKey(destination, durationDays, budget, preferences, {
    startDate,
    people,
    travelStyle,
    interests,
    hotelArea,
  });

  if (memoryCache.has(cacheKey)) {
    console.log('Returning itinerary from memory cache.');
    return memoryCache.get(cacheKey);
  }
  const cachedItinerary = await ItineraryCache.findOne({ cacheKey });

  if (cachedItinerary) {
    console.log('Returning itinerary from MongoDB cache.');
    const enriched = await enrichResultWithPlaceDetails(cachedItinerary.result);
    memoryCache.set(cacheKey, enriched);
    return enriched;
  }

  const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const prompt = buildPrompt({
    destination,
    durationDays,
    budget,
    preferences,
    startDate,
    people,
    travelStyle,
    interests,
    hotelArea,
  });

  const maxRetries = 1;
  let finalResult = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating itinerary with Groq (${modelName}). Attempt ${attempt + 1}`);

      // Thực hiện gọi API Groq bằng hàm fetch bản địa (Native Fetch)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: 'You are a professional travel planner assistant. Always respond in valid JSON format matching the requested schema.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.85, // Tạo ra kết quả đa dạng, tránh trùng lặp
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API returned status ${response.status}: ${errText}`);
      }

      const responseData = await response.json();

      if (responseData.usage) {
        const { prompt_tokens, completion_tokens, total_tokens } = responseData.usage;
        console.log(`[Groq Token Usage] Model: ${modelName} | Prompt: ${prompt_tokens} | Completion: ${completion_tokens} | Total: ${total_tokens}`);
      }

      const responseText = responseData.choices[0].message.content;
      const aiResult = safeJsonParse(responseText);

      finalResult = {
        ...aiResult,
        destination,
        startDate,
        days: Number(durationDays),
        people,
        budget: Number(budget),
        travelStyle,
        interests,
        hotelArea,
      };

      finalResult.budgetBreakdown = calculateBudgetBreakdown(
        finalResult,
        budget,
        durationDays
      );

      finalResult = fitResultToBudget(finalResult, budget, durationDays);

      // Làm giàu dữ liệu địa điểm trước khi cache
      finalResult = await enrichResultWithPlaceDetails(finalResult);

      memoryCache.set(cacheKey, finalResult);
      await ItineraryCache.findOneAndUpdate(
        { cacheKey },
        {
          cacheKey,
          destination,
          durationDays,
          budget,
          preferences,
          options: {
            startDate,
            people,
            travelStyle,
            interests,
            hotelArea,
          },
          result: finalResult,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
        {
          upsert: true,
          new: true,
        }
      );

      return finalResult;
    } catch (error) {
      const message = error?.message || '';
      console.error('Groq generation error:', message);

      const isQuotaError =
        message.includes('429') ||
        message.includes('Too Many Requests') ||
        message.includes('quota') ||
        message.includes('rate_limit');

      if (isQuotaError) {
        console.warn('Groq quota/rate limit reached. Returning mock itinerary without retry.');
        const mockRes = generateMockItinerary(
          destination,
          durationDays,
          budget,
          preferences,
          options
        );
        return await enrichResultWithPlaceDetails(mockRes);
      }

      const isRetryable =
        message.includes('503') ||
        message.includes('high demand') ||
        message.includes('Service Unavailable');

      if (isRetryable && attempt < maxRetries) {
        const delay = 5000 * (attempt + 1);
        console.log(`Retrying Groq after ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      console.warn('Groq failed. Returning mock itinerary.');
      const mockRes = generateMockItinerary(
        destination,
        durationDays,
        budget,
        preferences,
        options
      );
      return await enrichResultWithPlaceDetails(mockRes);
    }
  }
};

const generateMockItinerary = (
  destination,
  durationDays,
  budget,
  preferences = [],
  options = {}
) => {
  const startDate = options.startDate || new Date().toISOString().split('T')[0];
  const people = Number(options.people || 1);
  const travelStyle = options.travelStyle || preferences.join(', ') || 'tự túc';
  const interests = options.interests || preferences.join(', ') || 'ngắm cảnh';
  const hotelArea = options.hotelArea || 'Trung tâm';

  const itinerary = [];

  for (let i = 1; i <= Number(durationDays); i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i - 1);

    itinerary.push({
      day: i,
      date: date.toISOString().split('T')[0],
      theme: `Khám phá ${destination} ngày ${i}`,
      activities: [
        {
          time: '08:00',
          location: `Quán ăn địa phương tại ${destination}`,
          description: 'Ăn sáng với món đặc sản địa phương.',
          cost: Math.round((budget * 0.04) / durationDays),
          category: 'FOOD',
          transport: 'WALKING',
          durationMinutes: 60,
        },
        {
          time: '09:30',
          location: `Điểm tham quan nổi bật ở ${destination}`,
          description: `Tham quan theo sở thích: ${preferences.join(', ') || 'ngắm cảnh'}.`,
          cost: Math.round((budget * 0.08) / durationDays),
          category: 'PLACE',
          transport: 'GRAB',
          durationMinutes: 120,
        },
        {
          time: '12:00',
          location: `Nhà hàng bình dân tại ${destination}`,
          description: 'Ăn trưa với món địa phương.',
          cost: Math.round((budget * 0.06) / durationDays),
          category: 'FOOD',
          transport: 'WALKING',
          durationMinutes: 60,
        },
        {
          time: '15:00',
          location: `Khu vui chơi hoặc check-in tại ${destination}`,
          description: 'Thư giãn, chụp ảnh và khám phá khu vực xung quanh.',
          cost: Math.round((budget * 0.07) / durationDays),
          category: 'PLACE',
          transport: 'GRAB',
          durationMinutes: 120,
        },
      ],
    });
  }

  const result = {
    destination,
    startDate,
    days: Number(durationDays),
    people,
    budget: Number(budget),
    travelStyle,
    interests,
    hotelArea,
    hotelRecommendation: {
      name: `Khách sạn trung tâm ${destination}`,
      address: `Khu vực trung tâm ${destination}`,
      description:
        'Khách sạn phù hợp ngân sách, thuận tiện di chuyển đến các điểm tham quan chính.',
      estimatedCostPerNight: Math.round((budget * 0.3) / durationDays),
    },
    restaurantRecommendations: [
      {
        name: `Quán đặc sản ${destination}`,
        cuisineType: 'Ẩm thực địa phương',
        averagePricePerPerson: Math.round(budget * 0.04),
        rating: 4.5,
        address: `Trung tâm ${destination}`,
        description: 'Quán ăn địa phương phù hợp để thử món đặc sản.',
      },
      {
        name: `Nhà hàng bình dân ${destination}`,
        cuisineType: 'Món Việt',
        averagePricePerPerson: Math.round(budget * 0.05),
        rating: 4.3,
        address: `Khu ăn uống ${destination}`,
        description: 'Phù hợp cho nhóm bạn hoặc gia đình.',
      },
      {
        name: `Quán ăn tối nổi bật ${destination}`,
        cuisineType: 'Đặc sản địa phương',
        averagePricePerPerson: Math.round(budget * 0.06),
        rating: 4.4,
        address: `Gần trung tâm ${destination}`,
        description: 'Không gian dễ chịu, giá hợp lý.',
      },
    ],
    itinerary,
  };

  result.budgetBreakdown = calculateBudgetBreakdown(
    result,
    budget,
    durationDays
  );

  return fitResultToBudget(result, budget, durationDays);
};

module.exports = {
  generateItinerary,
  generateMockItinerary,
};
