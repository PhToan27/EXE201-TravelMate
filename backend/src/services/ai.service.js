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

const getPlaceType = (place) => {
  const name = String(place.name || '').toLowerCase();
  const category = String(place.category || '').toLowerCase();
  const address = String(place.address || '').toLowerCase();
  const text = `${name} ${category} ${address}`;

  if (
    text.includes('khach san') ||
    text.includes('hotel') ||
    text.includes('homestay') ||
    text.includes('resort') ||
    text.includes('nha nghi') ||
    text.includes('villa') ||
    category === 'khách sạn'
  ) {
    return 'HOTEL';
  }

  if (
    text.includes('nha hang') ||
    text.includes('quan an') ||
    text.includes('quan com') ||
    text.includes('cafe') ||
    text.includes('ca phe') ||
    text.includes('quan lau') ||
    text.includes('quan nuong') ||
    text.includes('tiem an') ||
    text.includes('am thuc') ||
    text.includes('an uong') ||
    text.includes('hai san') ||
    category === 'ẩm thực'
  ) {
    return 'RESTAURANT';
  }

  return 'ATTRACTION';
};

const REALISTIC_HOTELS = {
  'da nang': {
    economy: [
      { name: 'Khách sạn Minh Toàn Galaxy', address: '306 đường 2/9, Hải Châu, Đà Nẵng', description: 'Khách sạn 3 sao sạch sẽ, gần trung tâm và sông Hàn.', rating: 4.3 },
      { name: 'Avora Hotel', address: '170 Bạch Đằng, Hải Châu, Đà Nẵng', description: 'Vị trí đắc địa ngay mặt đường Bạch Đằng, phù hợp ngắm cảnh đêm.', rating: 4.4 },
      { name: 'Hadana Boutique Resort Da Nang', address: 'Phạm Văn Đồng, Sơn Trà, Đà Nẵng', description: 'Không gian ấm cúng, thiết kế boutique xinh xắn.', rating: 4.2 }
    ],
    standard: [
      { name: 'Haian Beach Hotel & Spa', address: '278 Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng', description: 'Khách sạn 4 sao sát biển Mỹ Khê, hồ bơi vô cực ngắm trọn cảnh biển.', rating: 4.6 },
      { name: 'Sala Danang Beach Hotel', address: '36 Lâm Hoành, Sơn Trà, Đà Nẵng', description: 'Gần biển Mỹ Khê, thiết kế hiện đại, nhiều tiện nghi sang xịn.', rating: 4.5 },
      { name: 'Cicilia Hotels & Spa', address: '06 Đỗ Bí, Ngũ Hành Sơn, Đà Nẵng', description: 'Nổi bật với phong cách spa trị liệu, dịch vụ chất lượng.', rating: 4.4 }
    ],
    luxury: [
      { name: 'InterContinental Danang Sun Peninsula Resort', address: 'Bán đảo Sơn Trà, Đà Nẵng', description: 'Resort siêu sang nằm biệt lập trên bán đảo Sơn Trà, đẳng cấp 5 sao quốc tế.', rating: 4.9 },
      { name: 'Furama Resort Danang', address: '105 Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng', description: 'Khu nghỉ dưỡng ẩm thực nổi tiếng với vườn nhiệt đới xanh mát và bãi biển riêng.', rating: 4.7 },
      { name: 'Pullman Danang Beach Resort', address: '101 Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng', description: 'Dịch vụ 5 sao đẳng cấp, hồ bơi lớn sát bãi cát trắng mịn.', rating: 4.8 }
    ]
  },
  'ha noi': {
    economy: [
      { name: 'Little Hanoi Deluxe Hotel', address: '1 Yên Thái, Hàng Bồ, Hoàn Kiếm, Hà Nội', description: 'Khách sạn phố cổ ấm cúng, dịch vụ chu đáo chuẩn gia đình.', rating: 4.4 },
      { name: 'Hanoi Emerald Waters Hotel Valley', address: '85 Lò Sũ, Lý Thái Tổ, Hoàn Kiếm, Hà Nội', description: 'Vị trí đắc địa gần Hồ Gươm, phòng ốc gọn gàng sạch sẽ.', rating: 4.5 }
    ],
    standard: [
      { name: 'La Sinfonia Del Rey Hotel & Spa', address: '33 Hang Dau, Hoàn Kiếm, Hà Nội', description: 'Khách sạn boutique sang trọng phong cách Hoàng gia ngay trung tâm phố cổ.', rating: 4.7 },
      { name: 'Lotte Hotel Hanoi', address: '54 Liễu Giai, Ba Đình, Hà Nội', description: 'Tòa nhà cao tầng ngắm toàn cảnh Hà Nội, hồ bơi trong nhà và ngoài trời hiện đại.', rating: 4.8 }
    ],
    luxury: [
      { name: 'Sofitel Legend Metropole Hanoi', address: '15 Ngô Quyền, Hoàn Kiếm, Hà Nội', description: 'Khách sạn lịch sử phong cách Pháp cổ điển huyền thoại, đẳng cấp 5 sao sang trọng hàng đầu.', rating: 4.9 },
      { name: 'JW Marriott Hotel Hanoi', address: '8 Đỗ Đức Dục, Nam Từ Liêm, Hà Nội', description: 'Kiến trúc hình rồng độc đáo, dịch vụ siêu sang chuẩn quốc tế.', rating: 4.8 }
    ]
  },
  'da lat': {
    economy: [
      { name: 'Dalat Green Hills Villa', address: 'Khu biệt thự Đường sắt, Phường 9, Đà Lạt', description: 'Homestay thanh lịch, phòng view thung lũng thông xanh mướt.', rating: 4.3 },
      { name: 'Khách sạn Tulip Dalat', address: '26-28 Ba Tháng Hai, Phường 1, Đà Lạt', description: 'Vị trí ngay chợ Đà Lạt, sạch sẽ tiện lợi.', rating: 4.2 }
    ],
    standard: [
      { name: 'TTC Hotel Premium - Dalat', address: '4 Nguyễn Thị Minh Khai, Phường 1, Đà Lạt', description: 'Khách sạn 4 sao hướng thẳng ra hồ Xuân Hương thơ mộng.', rating: 4.5 },
      { name: 'Dalat Palace Heritage Hotel', address: '2 Trần Phú, Phường 3, Đà Lạt', description: 'Khách sạn mang phong cách cổ điển thời Pháp thuộc, khu vườn rộng lớn.', rating: 4.7 }
    ],
    luxury: [
      { name: 'Ana Mandara Villas Dalat Resort & Spa', address: 'Lê Lai, Phường 5, Đà Lạt', description: 'Khu resort với các biệt thự cổ Pháp ẩn mình dưới rừng thông cô tịch, lãng mạn bậc nhất.', rating: 4.8 },
      { name: 'Swiss-Belresort Tuyen Lam', address: 'Hồ Tuyền Lâm, Đà Lạt', description: 'Như một lâu đài châu Âu cổ kính giữa đồi thông thơ mộng và sân golf xanh.', rating: 4.6 }
    ]
  },
  'phu quoc': {
    economy: [
      { name: 'Phu Quoc Valley Resort', address: 'Cửa Lấp, Dương Tơ, Phú Quốc', description: 'Bungalow sân vườn xanh mát yên tĩnh gần biển Bãi Trường.', rating: 4.3 },
      { name: 'Lahana Resort Phu Quoc', address: '91/3 Trần Hưng Đạo, Dương Đông, Phú Quốc', description: 'Resort đồi sinh thái ngập tràn sắc hoa lá, thân thiện môi trường.', rating: 4.5 }
    ],
    standard: [
      { name: 'Novotel Phu Quoc Resort', address: 'Đường Bào, Dương Tơ, Phú Quốc', description: 'Resort 5 sao sát bãi biển biển Dương Tơ, đầy đủ dịch vụ gia đình.', rating: 4.6 },
      { name: 'Pullman Phu Quoc Beach Resort', address: 'Đường Bào, Phú Quốc', description: 'Thiết kế lộng lẫy hiện đại, bãi biển riêng và hồ bơi siêu rộng.', rating: 4.7 }
    ],
    luxury: [
      { name: 'Regent Phu Quoc', address: 'Bãi Trường, Dương Tơ, Phú Quốc', description: 'Khu nghỉ dưỡng siêu sang, hồ bơi vô cực riêng trên tầng thượng mỗi villa.', rating: 4.9 },
      { name: 'JW Marriott Phu Quoc Emerald Bay Resort & Spa', address: 'Bãi Khem, An Thới, Phú Quốc', description: 'Kiến trúc trường đại học giả tưởng độc bản do Bill Bensley thiết kế bên bờ biển Bãi Khem cát trắng mịn.', rating: 4.9 }
    ]
  }
};

const getRealisticHotelRecommendation = async (destination, budgetBreakdown, days, hotelArea) => {
  const normDest = normalizeText(destination);
  const accommodationBudget = budgetBreakdown?.accommodation || 0;
  const avgCostPerNight = Math.max(
    Math.floor(Number(accommodationBudget) / Math.max(days, 1)),
    300000
  );

  let tier = 'economy';
  if (avgCostPerNight >= 600000 && avgCostPerNight < 1500000) {
    tier = 'standard';
  } else if (avgCostPerNight >= 1500000) {
    tier = 'luxury';
  }

  try {
    // 1. Query MongoDB for hotel candidates matching target categories/keywords
    const dbHotels = await Place.find({
      $or: [
        { category: { $regex: /khách sạn|hotel|resort|homestay|nơi lưu trú|villa|nhà nghỉ/i } },
        { name: { $regex: /khách sạn|hotel|resort|homestay|villa|nhà nghỉ/i } }
      ]
    }).lean();

    // 2. Filter candidates by destination (name or address containing destination)
    const matchedDestHotels = dbHotels.filter(hotel => {
      const normAddress = normalizeText(hotel.address);
      const normName = normalizeText(hotel.name);
      return normAddress.includes(normDest) || normName.includes(normDest) || normDest.includes(normAddress) || normDest.includes(normName);
    });

    if (matchedDestHotels.length > 0) {
      // 3. Classify MongoDB hotels into tiers based on price or keywords
      const classifiedHotels = matchedDestHotels.map(hotel => {
        let hotelPrice = parsePriceNumber(hotel.ticketPrice);
        let hotelTier = 'standard'; // Default

        if (hotelPrice && hotelPrice > 0) {
          if (hotelPrice < 600000) {
            hotelTier = 'economy';
          } else if (hotelPrice >= 600000 && hotelPrice < 1500000) {
            hotelTier = 'standard';
          } else {
            hotelTier = 'luxury';
          }
        } else {
          // If price is not parsed, classify by keyword matching
          const normName = normalizeText(hotel.name);
          const normCat = normalizeText(hotel.category);
          const nameAndCat = `${normName} ${normCat}`;

          if (
            nameAndCat.includes('resort') ||
            nameAndCat.includes('spa') ||
            nameAndCat.includes('villa') ||
            nameAndCat.includes('5-star') ||
            nameAndCat.includes('5 sao') ||
            nameAndCat.includes('luxury') ||
            nameAndCat.includes('intercontinental') ||
            nameAndCat.includes('furama') ||
            nameAndCat.includes('marriott') ||
            nameAndCat.includes('regent') ||
            nameAndCat.includes('pullman') ||
            nameAndCat.includes('grand') ||
            nameAndCat.includes('palace') ||
            nameAndCat.includes('plaza') ||
            nameAndCat.includes('sheraton') ||
            nameAndCat.includes('hilton')
          ) {
            hotelTier = 'luxury';
            hotelPrice = 2000000;
          } else if (
            nameAndCat.includes('homestay') ||
            nameAndCat.includes('hostel') ||
            nameAndCat.includes('nhà nghỉ') ||
            nameAndCat.includes('nha nghi') ||
            nameAndCat.includes('guesthouse') ||
            nameAndCat.includes('motel') ||
            nameAndCat.includes('backpacker') ||
            nameAndCat.includes('dorm') ||
            nameAndCat.includes('tulip')
          ) {
            hotelTier = 'economy';
            hotelPrice = 350000;
          } else {
            hotelTier = 'standard';
            hotelPrice = 800000;
          }
        }

        return { hotel, tier: hotelTier, estimatedPrice: hotelPrice };
      });

      // 4. Filter for hotels matching user's budget tier
      let pool = classifiedHotels.filter(h => h.tier === tier);
      
      // Fallback to all destination hotels if no hotel matches the exact tier
      if (pool.length === 0) {
        pool = classifiedHotels;
      }

      if (pool.length > 0) {
        // Pick random hotel
        const picked = pool[Math.floor(Math.random() * pool.length)];
        return {
          name: picked.hotel.name,
          address: picked.hotel.address || `Khu vực ${destination}`,
          description: picked.hotel.introduction || 'Nơi lưu trú thực tế từ cơ sở dữ liệu MongoDB.',
          estimatedCostPerNight: picked.estimatedPrice || avgCostPerNight,
          rating: picked.hotel.rating || 4.5,
        };
      }
    }
  } catch (error) {
    console.error('Error fetching hotels from MongoDB, falling back to static list:', error.message);
  }

  // Find destination in pool (static fallback)
  let hotelPool = [];
  const keys = Object.keys(REALISTIC_HOTELS);
  const matchedKey = keys.find(k => normDest.includes(k) || k.includes(normDest));

  if (matchedKey && REALISTIC_HOTELS[matchedKey][tier]) {
    hotelPool = REALISTIC_HOTELS[matchedKey][tier];
  }

  if (hotelPool.length > 0) {
    const picked = hotelPool[Math.floor(Math.random() * hotelPool.length)];
    return {
      name: picked.name,
      address: picked.address,
      description: picked.description,
      estimatedCostPerNight: avgCostPerNight,
      rating: picked.rating || 4.5,
    };
  }

  // Fallback for other locations
  let hotelName = `Khách sạn ${destination}`;
  let address = hotelArea || `Khu trung tâm, ${destination}`;
  let description = 'Gợi ý lưu trú thuận tiện di chuyển trong lịch trình.';
  
  if (tier === 'economy') {
    hotelName = `Homestay & Hostel ${destination}`;
    description = 'Lưu trú giá tiết kiệm, không gian sạch sẽ ấm cúng.';
  } else if (tier === 'standard') {
    hotelName = `Khách sạn Boutique ${destination}`;
    description = 'Khách sạn tiêu chuẩn 3-4 sao với dịch vụ tiện nghi đầy đủ.';
  } else {
    hotelName = `Grand Resort & Spa ${destination}`;
    description = 'Khu nghỉ dưỡng cao cấp 5 sao với chất lượng dịch vụ thượng hạng.';
  }

  return {
    name: hotelName,
    address,
    description,
    estimatedCostPerNight: avgCostPerNight,
    rating: tier === 'economy' ? 4.1 : tier === 'standard' ? 4.5 : 4.8,
  };
};

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
  BEACH: ['bien', 'bai tam', 'dao', 'ban dao', 'my khe', 'pham van dong', 'son tra', 'beach', 'cat trang'],
  CULTURE: ['van hoa', 'chua', 'bao tang', 'di tich', 'pho co', 'cau', 'lang', 'tam linh', 'lich su', 'co kinh'],
  NATURE: ['thien nhien', 'nui', 'rung', 'suoi', 'deo', 'son tra', 'ngu hanh son', 'hoa phu', 'thac', 'dong vat'],
  HISTORICAL: ['lich su', 'di tich', 'bao tang', 'lang tam', 'thanh dia', 'chua', 'phong kien', 'co kinh'],
  ADVENTURE: ['mao hiem', 'leo nui', 'phuot', 'thac', 'trekking', 'zipline', 'nhay du', 'duong deo'],
  PHOTOGRAPHY: ['chup anh', 'view dep', 'checkin', 'song ao', 'chieu hoang hon', 'binh minh', 'canh dep'],
  SHOPPING: ['mua sam', 'cho', 'sieu thi', 'trung tam thuong mai', 'cho dem', 'dac san', 'qua luu niem'],
  NIGHTLIFE: ['bar', 'club', 'pub', 'cho dem', 'nhac song', 'bar mini', 'nightlife', 'pho di bo'],
};

const STYLE_CATEGORY = {
  FOOD: 'FOOD',
  BEACH: 'REST',
  CULTURE: 'PLACE',
  NATURE: 'PLACE',
  HISTORICAL: 'PLACE',
  ADVENTURE: 'PLACE',
  PHOTOGRAPHY: 'OTHER',
  SHOPPING: 'SHOPPING',
  NIGHTLIFE: 'OTHER',
};

const TIME_SLOTS = ['08:00', '10:30', '14:30', '18:00'];

const getPreferredTravelStyles = (options = {}) => {
  const raw = normalizeText(`${options.travelStyle || ''} ${options.interests || ''}`).toUpperCase();
  const styles = [
    'FOOD',
    'BEACH',
    'CULTURE',
    'NATURE',
    'HISTORICAL',
    'ADVENTURE',
    'PHOTOGRAPHY',
    'SHOPPING',
    'NIGHTLIFE',
  ].filter((style) => raw.includes(style));
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
  // Filter out hotel places from itinerary activities
  const nonHotelPlaces = allPlaces.filter(place => getPlaceType(place) !== 'HOTEL');

  const destinationPlaces = nonHotelPlaces.filter((place) => isDestinationMatch(place, destination));
  const sourcePlaces = destinationPlaces.length ? destinationPlaces : nonHotelPlaces;
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
  const type = getPlaceType(place);
  if (type === 'HOTEL') return 'HOTEL';
  if (type === 'RESTAURANT') return 'FOOD';

  const text = getPlaceText(place);
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

const getSystemPrompt = () => {
  return `Bạn là một trợ lý du lịch AI chuyên nghiệp. Hãy tạo một kế hoạch du lịch chi tiết dưới dạng JSON dựa trên các yêu cầu sau.
Kết quả phải tuân theo cấu trúc JSON chính xác được mô tả dưới đây mà không chứa bất kỳ văn bản giải thích hay định dạng markdown nào khác ngoài chuỗi JSON sạch.

Cấu trúc JSON yêu cầu:
{
  "destination": "Tên điểm đến",
  "startDate": "YYYY-MM-DD",
  "days": 3,
  "people": 2,
  "budget": 5000000,
  "travelStyle": "Danh sách phong cách",
  "interests": "Danh sách sở thích",
  "hotelArea": "Khu vực khách sạn gợi ý",
  "aiProvider": "openai",
  "hotelRecommendation": {
    "name": "Tên khách sạn gợi ý",
    "address": "Địa chỉ khách sạn hoặc khu vực",
    "description": "Mô tả lý do chọn",
    "estimatedCostPerNight": 500000
  },
  "restaurantRecommendations": [
    {
      "name": "Tên quán ăn",
      "cuisineType": "Loại ẩm thực",
      "averagePricePerPerson": 120000,
      "rating": 4.5,
      "address": "Địa chỉ quán",
      "description": "Món ăn nổi bật nên thử"
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Chủ đề ngày 1",
      "activities": [
        {
          "time": "08:00",
          "location": "Tên địa điểm hoặc quán ăn",
          "address": "Địa chỉ địa điểm",
          "description": "Mô tả hoạt động chi tiết",
          "cost": 150000,
          "category": "PLACE",
          "transport": "MOTORBIKE",
          "durationMinutes": 90
        }
      ]
    }
  ],
  "budgetBreakdown": {
    "accommodation": 1500000,
    "foodAndBeverage": 1200000,
    "activitiesAndEntranceFees": 1000000,
    "transportation": 800000,
    "unforeseenExpenses": 500000
  }
}

Quy tắc:
1. "category" bắt buộc phải là một trong các giá trị viết hoa: "FOOD", "PLACE", "HOTEL", "TRANSPORT", "REST", "SHOPPING", "OTHER".
2. "transport" bắt buộc phải là một trong các giá trị viết hoa: "WALKING", "BIKE", "MOTORBIKE", "CAR", "BUS", "TAXI", "GRAB", "OTHER".
3. Giá trị cost, estimatedCostPerNight, averagePricePerPerson phải là số (Number), đơn vị là VND.
4. "itinerary" phải chứa đúng số lượng ngày ("days"). Mỗi ngày nên có 3-4 hoạt động.
5. Ngôn ngữ của toàn bộ phản hồi phải là Tiếng Việt.`;
};

const getUserPrompt = (destination, durationDays, budget, options) => {
  return `Hãy lập lịch trình du lịch cho thông tin sau:
- Điểm đến: ${destination}
- Số ngày: ${durationDays} ngày
- Ngày bắt đầu: ${options.startDate || 'Hôm nay'}
- Số người tham gia: ${options.people || 1} người
- Ngân sách tổng cộng: ${budget} VND
- Loại chuyến đi: ${options.tripType || 'Solo'}
- Sở thích/Phong cách: ${options.travelStyle || ''} ${options.interests || ''}
- Khu vực khách sạn mong muốn: ${options.hotelArea || 'Trung tâm'}`;
};

const normalizeAiResponse = async (data, destination, durationDays, budget, options) => {
  const normalized = {
    destination: data.destination || destination,
    startDate: data.startDate || options.startDate || new Date().toISOString().split('T')[0],
    days: Number(data.days || durationDays),
    people: Number(data.people || options.people || 1),
    budget: Number(data.budget || budget),
    travelStyle: data.travelStyle || options.travelStyle || 'CHILL',
    interests: data.interests || options.interests || '',
    hotelArea: data.hotelArea || options.hotelArea || 'Trung tâm',
    aiProvider: data.aiProvider || 'ai-llm',
  };

  const breakdown = data.budgetBreakdown || {};
  normalized.budgetBreakdown = {
    accommodation: Number(breakdown.accommodation || 0),
    foodAndBeverage: Number(breakdown.foodAndBeverage || 0),
    activitiesAndEntranceFees: Number(breakdown.activitiesAndEntranceFees || 0),
    transportation: Number(breakdown.transportation || 0),
    unforeseenExpenses: Number(breakdown.unforeseenExpenses || 0),
  };

  const generatedHotel = data.hotelRecommendation;
  const isGeneric = !generatedHotel?.name || 
                    generatedHotel.name.toLowerCase().includes('khách sạn khu vực') || 
                    generatedHotel.name.toLowerCase().includes('khach san khu vuc');

  normalized.hotelRecommendation = isGeneric 
    ? await getRealisticHotelRecommendation(normalized.destination, normalized.budgetBreakdown, normalized.days, normalized.hotelArea)
    : {
        name: generatedHotel.name,
        address: generatedHotel.address || normalized.hotelArea,
        description: generatedHotel.description || 'Gợi ý lưu trú phù hợp với chuyến đi của bạn.',
        estimatedCostPerNight: Number(generatedHotel.estimatedCostPerNight || 
          Math.max(Math.floor(Number(normalized.budgetBreakdown.accommodation || 0) / Math.max(normalized.days, 1)), 300000)
        ),
        rating: Number(generatedHotel.rating || 4.5),
      };

  normalized.restaurantRecommendations = Array.isArray(data.restaurantRecommendations)
    ? data.restaurantRecommendations.map(rest => ({
        name: rest.name || 'Quán ăn địa phương',
        cuisineType: rest.cuisineType || 'Ẩm thực địa phương',
        averagePricePerPerson: Number(rest.averagePricePerPerson || 0),
        rating: Number(rest.rating || 4.5),
        address: rest.address || normalized.destination,
        description: rest.description || 'Quán ăn ngon nổi bật.',
      }))
    : [];

  const rawItinerary = Array.isArray(data.itinerary) ? data.itinerary : [];
  normalized.itinerary = Array.from({ length: normalized.days }, (_, idx) => {
    const targetDay = idx + 1;
    const foundDay = rawItinerary.find(d => Number(d.day) === targetDay) || {};
    const date = new Date(normalized.startDate);
    date.setDate(date.getDate() + idx);

    const rawActivities = Array.isArray(foundDay.activities) ? foundDay.activities : [];
    const activities = rawActivities.map((act, actIdx) => {
      const category = String(act.category || 'PLACE').toUpperCase();
      const transport = String(act.transport || 'MOTORBIKE').toUpperCase();
      
      return {
        time: act.time || (actIdx === 0 ? '08:00' : actIdx === 1 ? '12:00' : '18:00'),
        location: act.location || act.activityName || 'Điểm tham quan',
        address: act.address || '',
        description: act.description || '',
        cost: Number(act.cost || 0),
        category: ['FOOD', 'PLACE', 'HOTEL', 'TRANSPORT', 'REST', 'SHOPPING', 'OTHER'].includes(category)
          ? category
          : 'PLACE',
        transport: ['WALKING', 'BIKE', 'MOTORBIKE', 'CAR', 'BUS', 'TAXI', 'GRAB', 'OTHER'].includes(transport)
          ? transport
          : 'MOTORBIKE',
        durationMinutes: Number(act.durationMinutes || 60),
      };
    });

    return {
      day: targetDay,
      date: date.toISOString().split('T')[0],
      theme: foundDay.theme || `Khám phá ${normalized.destination} - Ngày ${targetDay}`,
      activities,
    };
  });

  return normalized;
};

const callOpenAI = async (destination, durationDays, budget, options) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: getUserPrompt(destination, durationDays, budget, options) }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI');

  return JSON.parse(text);
};

const callGemini = async (destination, durationDays, budget, options) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `${getSystemPrompt()}\n\nYêu cầu cụ thể:\n${getUserPrompt(destination, durationDays, budget, options)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  if (text.startsWith('```json')) {
    text = text.substring(7);
  }
  if (text.endsWith('```')) {
    text = text.substring(0, text.length - 3);
  }
  text = text.trim();

  return JSON.parse(text);
};

const generateItineraryFallback = async (
  destination,
  durationDays,
  budget,
  preferences = [],
  options = {}
) => {
  const days = Number(durationDays);
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

  // Fetch actual restaurants from MongoDB Place collection matching destination
  let restaurants = [];
  try {
    const allDbPlaces = await Place.find({}).lean();
    const destRestaurants = allDbPlaces.filter(place => {
      const isRest = getPlaceType(place) === 'RESTAURANT';
      const matchesDest = isDestinationMatch(place, destination);
      return isRest && matchesDest;
    });

    if (destRestaurants.length > 0) {
      restaurants = destRestaurants.slice(0, 5).map(r => ({
        name: r.name,
        cuisineType: r.category || 'Ẩm thực địa phương',
        averagePricePerPerson: parsePriceNumber(r.ticketPrice) || 120000,
        rating: r.rating || 4.5,
        address: r.address || '',
        description: r.introduction || 'Quán ăn ẩm thực đặc sắc địa phương.'
      }));
    }
  } catch (err) {
    console.error('Error fetching restaurants from DB:', err.message);
  }

  // Fallback if none found in DB
  if (restaurants.length === 0) {
    restaurants = places
      .filter((place) => getPlaceType(place) === 'RESTAURANT')
      .slice(0, 5)
      .map((place) => ({
        name: place.name,
        cuisineType: 'Ẩm thực địa phương',
        averagePricePerPerson: Math.max(parsePriceNumber(place.ticketPrice) || 0, 50000),
        rating: place.rating || 4.5,
        address: place.address || '',
        description: getPlaceDescription(place),
      }));
  }

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
    hotelRecommendation: await getRealisticHotelRecommendation(destination, budgetPlan, days, options.hotelArea),
    restaurantRecommendations: restaurants,
    itinerary,
  };

  result.budgetBreakdown = calculateBudgetBreakdown(result, budget, days);
  console.log(`Generated itinerary from places collection fallback for "${destination}".`);
  return result;
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

  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('Attempting itinerary generation with OpenAI GPT...');
      const rawRes = await callOpenAI(destination, days, budget, options);
      const normalized = await normalizeAiResponse(rawRes, destination, days, budget, options);
      normalized.aiProvider = 'openai';
      return normalized;
    } catch (openaiError) {
      console.error('OpenAI Itinerary generation failed, trying Gemini:', openaiError.message);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('Attempting itinerary generation with Gemini API...');
      const rawRes = await callGemini(destination, days, budget, options);
      const normalized = await normalizeAiResponse(rawRes, destination, days, budget, options);
      normalized.aiProvider = 'gemini';
      return normalized;
    } catch (geminiError) {
      console.error('Gemini Itinerary generation failed, falling back to local search:', geminiError.message);
    }
  }

  return generateItineraryFallback(destination, days, budget, preferences, options);
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getCoords = (act) => {
  if (act.coordinates && typeof act.coordinates.lat === 'number' && typeof act.coordinates.lng === 'number') {
    return act.coordinates;
  }
  if (act.location && typeof act.location.lat === 'number' && typeof act.location.lng === 'number') {
    return act.location;
  }
  return null;
};

const optimizeRoute = (activities = []) => {
  if (!Array.isArray(activities) || activities.length <= 2) {
    return {
      activities,
      stats: { originalDistance: 0, optimizedDistance: 0, distanceSaved: 0, timeSavedMinutes: 0 },
    };
  }

  // Calculate total route distance for activities with coordinates in their current order
  const getRouteDistance = (list) => {
    let total = 0;
    let prev = null;
    for (const act of list) {
      const coords = getCoords(act);
      if (coords) {
        if (prev) {
          total += getDistance(prev.lat, prev.lng, coords.lat, coords.lng);
        }
        prev = coords;
      }
    }
    return total;
  };

  const originalDistance = getRouteDistance(activities);

  // Group activities based on coordinate availability
  const withCoords = activities.filter(a => getCoords(a) !== null);
  const withoutCoords = activities.filter(a => getCoords(a) === null);

  if (withCoords.length <= 2) {
    return {
      activities,
      stats: {
        originalDistance: Number(originalDistance.toFixed(2)),
        optimizedDistance: Number(originalDistance.toFixed(2)),
        distanceSaved: 0,
        timeSavedMinutes: 0,
      },
    };
  }

  // TSP: Start from the first activity, permute the rest to find the shortest path
  const start = withCoords[0];
  const candidates = withCoords.slice(1);
  let bestPath = [start, ...candidates];
  let minDistance = Infinity;

  const permute = (arr, memo = []) => {
    if (arr.length === 0) {
      let dist = 0;
      let prev = getCoords(start);
      for (const curr of memo) {
        const currCoords = getCoords(curr);
        dist += getDistance(prev.lat, prev.lng, currCoords.lat, currCoords.lng);
        prev = currCoords;
      }
      if (dist < minDistance) {
        minDistance = dist;
        bestPath = [start, ...memo];
      }
      return;
    }
    // Safety cap: permute at most 8 items to prevent CPU locking
    for (let i = 0; i < Math.min(arr.length, 8); i++) {
      const curr = arr.slice();
      const next = curr.splice(i, 1);
      permute(curr.slice(), memo.concat(next));
    }
  };

  permute(candidates);

  const optimizedDistance = getRouteDistance(bestPath);
  const distanceSaved = Math.max(originalDistance - optimizedDistance, 0);
  const timeSavedMinutes = Math.round(distanceSaved * 2); // 30 km/h is 2 mins/km

  return {
    activities: [...bestPath, ...withoutCoords],
    stats: {
      originalDistance: Number(originalDistance.toFixed(2)),
      optimizedDistance: Number(optimizedDistance.toFixed(2)),
      distanceSaved: Number(distanceSaved.toFixed(2)),
      timeSavedMinutes,
    },
  };
};

module.exports = {
  generateItinerary,
  optimizeRoute,
};

