const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const ItineraryCache = require('../models/ItineraryCache');
const memoryCache = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createCacheKey = (destination, durationDays, budget, preferences, options) => {
  const raw = JSON.stringify({
    destination: String(destination || '').toLowerCase().trim(),
    durationDays,
    budget,
    preferences,
    options,
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

const buildPrompt = ({
  destination,
  durationDays,
  budget,
  preferences,
  startDate,
  people,
  travelStyle,
  interests,
  hotelArea,
}) => {
  return `
Bạn là AI tạo lịch trình du lịch cho app TravelMate.

Chỉ trả về JSON hợp lệ.
Không markdown.
Không giải thích thêm.

Thông tin chuyến đi:
- destination: ${destination}
- startDate: ${startDate}
- durationDays: ${durationDays}
- people: ${people}
- budget: ${budget} VND
- travelStyle: ${travelStyle}
- interests: ${interests}
- hotelArea: ${hotelArea}

Yêu cầu:
- Tạo lịch trình đúng ${durationDays} ngày.
- Mỗi ngày 3 đến 5 hoạt động.
- Hoạt động thực tế, không quá dày.
- Các địa điểm trong cùng ngày nên gần nhau.
- Chi phí từng hoạt động là số VND.
- Gợi ý 1 khách sạn phù hợp ngân sách.
- Gợi ý ít nhất 3 quán ăn địa phương.
- Tổng chi phí hoạt động + khách sạn không vượt ngân sách.

JSON schema bắt buộc:
{
  "destination": "",
  "startDate": "",
  "days": 0,
  "people": 0,
  "budget": 0,
  "travelStyle": "",
  "interests": "",
  "hotelArea": "",
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
          "category": "FOOD",
          "transport": "GRAB",
          "durationMinutes": 60
        }
      ]
    }
  ]
}

category chỉ được chọn:
FOOD, PLACE, HOTEL, TRANSPORT, REST, SHOPPING, OTHER

transport chỉ được chọn:
WALKING, BIKE, MOTORBIKE, CAR, BUS, TAXI, GRAB, OTHER
`;
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

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('Missing GEMINI_API_KEY. Using mock itinerary.');
    return generateMockItinerary(destination, durationDays, budget, preferences, options);
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
    memoryCache.set(cacheKey, cachedItinerary.result);
    return cachedItinerary.result;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',

    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
      maxOutputTokens: 3000,
    },
  });

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

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating itinerary with Gemini. Attempt ${attempt + 1}`);

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const aiResult = safeJsonParse(responseText);

      const finalResult = {
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
      const status = error?.status || error?.response?.status;
      const message = error?.message || '';

      console.error('Gemini generation error:', message);

      const isRetryable =
        status === 429 ||
        status === 503 ||
        message.includes('Too Many Requests') ||
        message.includes('high demand') ||
        message.includes('Service Unavailable');

      if (isRetryable && attempt < maxRetries) {
        const retryDelayMatch = message.match(/retryDelay":"(\d+)s"/);
        const retryInMatch = message.match(/retry in ([\d.]+)s/i);

        const delay = retryDelayMatch
          ? Number(retryDelayMatch[1]) * 1000
          : retryInMatch
            ? Math.ceil(Number(retryInMatch[1])) * 1000
            : 5000 * (attempt + 1);

        console.log(`Retrying Gemini after ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      console.warn('Gemini failed. Returning mock itinerary.');
      return generateMockItinerary(
        destination,
        durationDays,
        budget,
        preferences,
        options
      );
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
          description: `Tham quan theo sở thích: ${preferences.join(', ') || 'ngắm cảnh'
            }.`,
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

  return result;
};

module.exports = {
  generateItinerary,
  generateMockItinerary,
};