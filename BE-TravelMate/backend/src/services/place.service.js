const Place = require('../models/Place');

const POPULAR_PLACES = {
  'bánh tráng cuốn thịt heo trần': {
    name: 'Bánh tráng cuốn thịt heo Trần',
    category: 'Ẩm thực',
    rating: 4.6,
    reviewsCount: '1k+',
    duration: '45 phút - 1 giờ',
    difficulty: 'Dễ',
    introduction:
      'Bánh tráng cuốn thịt heo Trần là một địa chỉ đặc sản Đà Nẵng nổi tiếng, phù hợp để thưởng thức món bánh tráng cuốn thịt heo trong lịch trình ẩm thực.',
    address: '4 Lê Duẩn, Hải Châu, Đà Nẵng',
    openHours: '09:00 - 21:00 (Tham khảo)',
    ticketPrice: 'Khoảng 70.000 - 165.000 VNĐ / người',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 16.071657, lng: 108.222615 },
  },

  'mì quảng bà mua': {
    name: 'Mì Quảng Bà Mua',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '100+',
    duration: '45 phút - 1 giờ',
    difficulty: 'Dễ',
    introduction:
      'Mì Quảng Bà Mua là một quán mì Quảng quen thuộc ở Đà Nẵng, phù hợp để ghé ăn đặc sản địa phương trong lịch trình tham quan thành phố.',
    address: '95A Nguyễn Tri Phương, Thanh Khê, Đà Nẵng',
    openHours: '06:00 - 22:00 (Tham khảo)',
    ticketPrice: 'Khoảng 30.000 - 70.000 VNĐ / tô',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 16.0678, lng: 108.2039 },
  },

  'ngũ hành sơn': {
    name: 'Ngũ Hành Sơn',
    category: 'Di tích quốc gia',
    rating: 4.8,
    reviewsCount: '1.2k',
    duration: '2-3 giờ',
    difficulty: 'Trung bình',
    introduction:
      'Ngũ Hành Sơn là danh thắng nổi tiếng của Đà Nẵng, gồm nhiều ngọn núi đá vôi, hang động và chùa chiền cổ kính. Đây là địa điểm phù hợp để tham quan, chụp ảnh và tìm hiểu văn hóa tâm linh địa phương.',
    address: '81 Huyền Trân Công Chúa, Hòa Hải, Ngũ Hành Sơn, Đà Nẵng',
    openHours: '07:00 - 17:30 (Hàng ngày)',
    ticketPrice: 'Khoảng 40.000 VNĐ / người lớn',
    imageUrl:
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 16.003182, lng: 108.263884 },
  },

  'bà nà hills': {
    name: 'Bà Nà Hills',
    category: 'Khu du lịch sinh thái & vui chơi',
    rating: 4.7,
    reviewsCount: '15k',
    duration: 'Nửa ngày đến 1 ngày',
    difficulty: 'Dễ',
    introduction:
      'Bà Nà Hills là khu du lịch nổi tiếng gần Đà Nẵng, được biết đến với Cầu Vàng, làng Pháp, khí hậu mát mẻ và hệ thống cáp treo dài. Đây là lựa chọn phù hợp cho gia đình, nhóm bạn và khách thích chụp ảnh.',
    address: 'Hòa Phú, Hòa Vang, Đà Nẵng',
    openHours: '08:00 - 22:00 (Hàng ngày)',
    ticketPrice: 'Khoảng 900.000 VNĐ / người lớn',
    imageUrl:
      'https://images.unsplash.com/photo-15555244162-803834f70033?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 15.9984, lng: 107.9968 },
  },

  'chùa linh ứng': {
    name: 'Chùa Linh Ứng Sơn Trà',
    category: 'Danh thắng tâm linh',
    rating: 4.8,
    reviewsCount: '4.5k',
    duration: '1-2 giờ',
    difficulty: 'Dễ',
    introduction:
      'Chùa Linh Ứng Sơn Trà là địa điểm tâm linh nổi bật ở Đà Nẵng, nằm trên bán đảo Sơn Trà và hướng ra biển. Nơi đây có tượng Phật Bà cao lớn, không gian yên bình và tầm nhìn đẹp về thành phố.',
    address: 'Thọ Quang, Sơn Trà, Đà Nẵng',
    openHours: '06:00 - 21:00 (Hàng ngày)',
    ticketPrice: 'Miễn phí',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 16.1002, lng: 108.2778 },
  },

  'bán đảo sơn trà': {
    name: 'Bán đảo Sơn Trà',
    category: 'Danh thắng tự nhiên',
    rating: 4.7,
    reviewsCount: '3.2k',
    duration: 'Nửa ngày',
    difficulty: 'Trung bình',
    introduction:
      'Bán đảo Sơn Trà là điểm đến tự nhiên nổi bật của Đà Nẵng với rừng, biển, đường ven núi và nhiều điểm ngắm cảnh. Đây là nơi phù hợp để đi xe máy, ngắm biển, chụp ảnh và khám phá thiên nhiên.',
    address: 'Sơn Trà, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: 'Miễn phí',
    imageUrl:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 16.1205, lng: 108.2912 },
  },

  'cầu rồng': {
    name: 'Cầu Rồng',
    category: 'Biểu tượng thành phố',
    rating: 4.8,
    reviewsCount: '8k',
    duration: '30 phút - 1 giờ',
    difficulty: 'Dễ',
    introduction:
      'Cầu Rồng là biểu tượng hiện đại của Đà Nẵng, nổi bật với thiết kế hình rồng vươn ra biển. Vào cuối tuần, du khách thường đến xem cầu phun lửa và phun nước vào buổi tối.',
    address: 'Đường Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: 'Miễn phí',
    imageUrl:
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 16.0611, lng: 108.2272 },
  },
};

const normalizeText = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .normalize('NFC');
};

const escapeRegex = (text) => {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const buildSearchRegex = (value) => new RegExp(escapeRegex(String(value || '').trim()), 'i');

const normalizeSearchText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Ä‘/g, 'd')
    .trim();

const getPlaceSearchText = (place) =>
  normalizeSearchText(
    [
      place?.name,
      place?.address,
      place?.category,
      place?.introduction,
      place?.ticketPrice,
    ].join(' ')
  );

const getSearchTokens = (value) =>
  normalizeSearchText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

const getCategoryKeywords = (category) => {
  const normalized = normalizeSearchText(category);
  if (!normalized) return [];

  if (['food', 'an uong', 'am thuc'].some((keyword) => normalized.includes(keyword))) {
    return ['food', 'an uong', 'am thuc', 'hai san', 'nha hang', 'quan', 'mon'];
  }

  if (['beach', 'bien'].some((keyword) => normalized.includes(keyword))) {
    return ['beach', 'bien', 'bai tam', 'hai san', 'vinh'];
  }

  if (['culture', 'van hoa'].some((keyword) => normalized.includes(keyword))) {
    return ['culture', 'van hoa', 'chua', 'bao tang', 'di tich', 'lich su', 'cau'];
  }

  if (['nature', 'thien nhien'].some((keyword) => normalized.includes(keyword))) {
    return ['nature', 'thien nhien', 'nui', 'son tra', 'suoi', 'rung', 'ban dao'];
  }

  return [normalized];
};

const getKeywordScore = (place, normalizedKeyword, keywordTokens) => {
  if (!normalizedKeyword && !keywordTokens.length) return 1;

  const nameText = normalizeSearchText(place?.name);
  const addressText = normalizeSearchText(place?.address);
  const categoryText = normalizeSearchText(place?.category);
  const searchText = getPlaceSearchText(place);
  let score = 0;

  if (nameText === normalizedKeyword) score += 120;
  if (nameText.includes(normalizedKeyword)) score += 80;
  if (searchText.includes(normalizedKeyword)) score += 50;

  keywordTokens.forEach((token) => {
    if (nameText.includes(token)) score += 24;
    else if (addressText.includes(token)) score += 10;
    else if (categoryText.includes(token)) score += 8;
    else if (searchText.includes(token)) score += 4;
  });

  return score;
};

const getCategoryScore = (place, categoryKeywords) => {
  if (!categoryKeywords.length) return 0;

  const searchText = getPlaceSearchText(place);
  return categoryKeywords.reduce(
    (score, keyword) => (searchText.includes(keyword) ? score + 12 : score),
    0
  );
};

const searchPlaces = async ({ q = '', category = '', limit = 30 } = {}) => {
  const keyword = String(q || '').trim();
  const categoryKeyword = String(category || '').trim();
  const normalizedKeyword = normalizeSearchText(keyword);
  const categoryKeywords = getCategoryKeywords(categoryKeyword);
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);

  const filters = [];
  if (keyword) {
    const keywordRegex = buildSearchRegex(keyword);
    filters.push({
      $or: [
        { name: keywordRegex },
        { address: keywordRegex },
        { category: keywordRegex },
        { introduction: keywordRegex },
      ],
    });
  }

  if (categoryKeyword && !['all', 'tat ca', 'tất cả'].includes(categoryKeyword.toLowerCase())) {
    filters.push({ category: buildSearchRegex(categoryKeyword) });
  }

  const query = filters.length ? { $and: filters } : {};
  let places = await Place.find(query)
    .sort({ rating: -1, name: 1 })
    .limit(safeLimit)
    .lean();

  if ((normalizedKeyword || categoryKeywords.length) && places.length < safeLimit) {
    places = await Place.find({})
      .sort({ rating: -1, name: 1 })
      .limit(safeLimit)
      .lean();
  }

  return places
    .filter((place) => {
      const searchText = getPlaceSearchText(place);
      const matchesKeyword = !normalizedKeyword || searchText.includes(normalizedKeyword);
      const matchesCategory =
        !categoryKeywords.length || categoryKeywords.some((keyword) => searchText.includes(keyword));
      return matchesKeyword && matchesCategory;
    })
    .slice(0, safeLimit);
};

const searchPlacesBySimilarity = async ({ q = '', category = '', limit = 30 } = {}) => {
  const keyword = String(q || '').trim();
  const categoryKeyword = String(category || '').trim();
  const normalizedKeyword = normalizeSearchText(keyword);
  const keywordTokens = getSearchTokens(keyword);
  const categoryKeywords = getCategoryKeywords(categoryKeyword);
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);

  const places = await Place.find({})
    .sort({ rating: -1, name: 1 })
    .limit(500)
    .lean();

  if (!normalizedKeyword && !categoryKeywords.length) {
    return places.slice(0, safeLimit);
  }

  return places
    .map((place) => {
      const keywordScore = getKeywordScore(place, normalizedKeyword, keywordTokens);
      const categoryScore = getCategoryScore(place, categoryKeywords);
      const ratingScore = Math.max(Number(place.rating || 0), 0);
      return {
        place,
        score: keywordScore + categoryScore + ratingScore,
        keywordScore,
        categoryScore,
      };
    })
    .filter((item) => {
      if (normalizedKeyword) return item.keywordScore > 0;
      return item.categoryScore > 0;
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.place)
    .slice(0, safeLimit);
};

const getUnsplashImage = (placeName) => {
  const norm = normalizeText(placeName);

  if (
    norm.includes('biển') ||
    norm.includes('bãi') ||
    norm.includes('vịnh') ||
    norm.includes('đảo')
  ) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80';
  }

  if (
    norm.includes('chùa') ||
    norm.includes('đền') ||
    norm.includes('di tích') ||
    norm.includes('tháp') ||
    norm.includes('lăng')
  ) {
    return 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80';
  }

  if (
    norm.includes('ăn') ||
    norm.includes('nhà hàng') ||
    norm.includes('quán') ||
    norm.includes('chợ')
  ) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80';
  }

  return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80';
};

const findPopularPlace = (placeName) => {
  const searchName = normalizeText(placeName);

  const key = Object.keys(POPULAR_PLACES).find((k) => {
    const normalizedKey = normalizeText(k);
    return (
      searchName.includes(normalizedKey) ||
      normalizedKey.includes(searchName)
    );
  });

  return key ? POPULAR_PLACES[key] : null;
};

const generateDefaultPlaceData = (placeName) => {
  return {
    name: placeName,
    category: 'Điểm tham quan',
    rating: 4.5,
    reviewsCount: '100+',
    duration: '1-2 giờ',
    difficulty: 'Dễ',
    introduction: `${placeName} là một địa điểm đáng cân nhắc trong chuyến đi. Du khách có thể tham quan, chụp ảnh, trải nghiệm văn hóa địa phương và kết hợp với các điểm gần đó để tối ưu lịch trình.`,
    address: `${placeName}, Việt Nam`,
    openHours: '08:00 - 18:00 (Tham khảo)',
    ticketPrice: 'Miễn phí hoặc thay đổi tùy thời điểm',
    imageUrl: getUnsplashImage(placeName),
    coordinates: {
      lat: 16.0544,
      lng: 108.2022,
    },
  };
};

const savePlaceSafely = async (placeData) => {
  try {
    const existingPlace = await Place.findOne({
      name: {
        $regex: new RegExp(`^${escapeRegex(placeData.name)}$`, 'i'),
      },
    });

    if (existingPlace) {
      Object.assign(existingPlace, placeData);
      return await existingPlace.save();
    }

    return await Place.create(placeData);
  } catch (error) {
    console.error('Save place cache error:', error.message);
    return placeData;
  }
};

const getPlaceDetails = async (placeName) => {
  if (!placeName || !String(placeName).trim()) {
    throw new Error('Tên địa điểm không được để trống');
  }

  const cleanName = String(placeName).trim();

  const popularPlace = findPopularPlace(cleanName);

  if (popularPlace) {
    console.log(`Retrieved place "${cleanName}" from static dictionary.`);
    return await savePlaceSafely(popularPlace);
  }

  const cachedPlace = await Place.findOne({
    name: {
      $regex: new RegExp(`^${escapeRegex(cleanName)}$`, 'i'),
    },
  });

  if (cachedPlace) {
    console.log(`Retrieved place "${cleanName}" from MongoDB cache.`);
    return cachedPlace;
  }

  console.log(`Using fallback place template for "${cleanName}".`);

  const fallbackPlace = generateDefaultPlaceData(cleanName);
  return await savePlaceSafely(fallbackPlace);
};

module.exports = {
  getPlaceDetails,
  searchPlaces: searchPlacesBySimilarity,
};
