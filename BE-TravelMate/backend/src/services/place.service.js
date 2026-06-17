const Place = require('../models/Place');

const POPULAR_PLACES = {
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

/**
 * Get details for a list of places in bulk.
 * @param {Array<string>} placeNames - Array of place names to resolve
 * @returns {Promise<Map<string, Object>>} Map of normalized original place names to their DB records
 */
const getBulkPlacesDetails = async (placeNames) => {
  if (!Array.isArray(placeNames) || placeNames.length === 0) {
    return new Map();
  }

  const cleanNames = [...new Set(placeNames.map(name => String(name || '').trim()).filter(Boolean))];
  if (cleanNames.length === 0) {
    return new Map();
  }

  // 1. Gather search targets for DB (including canonical names from the dictionary)
  const dbSearchNames = new Set(cleanNames);
  const nameToPopularMap = new Map();

  for (const name of cleanNames) {
    const norm = normalizeText(name);
    const popular = findPopularPlace(name);
    if (popular) {
      dbSearchNames.add(popular.name);
      nameToPopularMap.set(norm, popular);
    }
  }

  // 2. Query MongoDB for existing records in ONE command
  const regexList = Array.from(dbSearchNames).map(name => new RegExp(`^${escapeRegex(name)}$`, 'i'));
  const existingPlaces = await Place.find({
    name: { $in: regexList }
  });

  // Create lookup maps
  const existingPlacesMap = new Map();
  existingPlaces.forEach(p => {
    existingPlacesMap.set(normalizeText(p.name), p);
  });

  const missingPlacesMap = new Map();
  const resolvedMap = new Map();

  // 3. Resolve each name
  for (const name of cleanNames) {
    const normName = normalizeText(name);

    // Case A: Exists directly in DB by its original name
    if (existingPlacesMap.has(normName)) {
      resolvedMap.set(normName, existingPlacesMap.get(normName));
      continue;
    }

    // Case B: Matches popular place dictionary
    const popular = nameToPopularMap.get(normName);
    if (popular) {
      const normPopularName = normalizeText(popular.name);
      if (existingPlacesMap.has(normPopularName)) {
        resolvedMap.set(normName, existingPlacesMap.get(normPopularName));
      } else if (missingPlacesMap.has(normPopularName)) {
        resolvedMap.set(normName, missingPlacesMap.get(normPopularName));
      } else {
        missingPlacesMap.set(normPopularName, popular);
        resolvedMap.set(normName, popular);
      }
      continue;
    }

    // Case C: Fallback default
    const fallback = generateDefaultPlaceData(name);
    const normFallbackName = normalizeText(fallback.name);
    if (existingPlacesMap.has(normFallbackName)) {
      resolvedMap.set(normName, existingPlacesMap.get(normFallbackName));
    } else if (missingPlacesMap.has(normFallbackName)) {
      resolvedMap.set(normName, missingPlacesMap.get(normFallbackName));
    } else {
      missingPlacesMap.set(normFallbackName, fallback);
      resolvedMap.set(normName, fallback);
    }
  }

  // 4. Bulk insert missing places in ONE operation
  if (missingPlacesMap.size > 0) {
    try {
      const toInsert = Array.from(missingPlacesMap.values());
      // Sử dụng ordered: false để nếu trùng 1-2 địa điểm, những cái khác vẫn được insert bình thường
      const insertedPlaces = await Place.insertMany(toInsert, { ordered: false });

      // Cập nhật resolvedMap bằng Document chính thức từ DB (Đã có _id)
      insertedPlaces.forEach(p => {
        const normInsertedName = normalizeText(p.name);
        for (const name of cleanNames) {
          const normName = normalizeText(name);
          const resVal = resolvedMap.get(normName);
          if (resVal && normalizeText(resVal.name) === normInsertedName) {
            resolvedMap.set(normName, p);
          }
        }
      });
    } catch (insertError) {
      console.error('Bulk save place cache warning/error:', insertError.message);

      // Trích xuất tất cả các docs đã được nạp thành công trước khi bị chặn bởi lỗi trùng lặp
      const inserted = insertError.insertedDocs || (insertError.result && insertError.result.insertedDocs) || [];
      inserted.forEach(p => {
        const normInsertedName = normalizeText(p.name);
        for (const name of cleanNames) {
          const normName = normalizeText(name);
          const resVal = resolvedMap.get(normName);
          if (resVal && normalizeText(resVal.name) === normInsertedName) {
            resolvedMap.set(normName, p);
          }
        }
      });

      // Đối với những địa điểm hoàn toàn thất bại không insert được, truy vấn nhanh lại để lấy _id sẵn có
      const failedNames = Array.from(missingPlacesMap.keys());
      const regexFailed = failedNames.map(n => new RegExp(`^${escapeRegex(n)}$`, 'i'));
      const backupFetch = await Place.find({ name: { $in: regexFailed } }).lean();

      backupFetch.forEach(p => {
        const normB = normalizeText(p.name);
        for (const name of cleanNames) {
          const normName = normalizeText(name);
          const resVal = resolvedMap.get(normName);
          if (resVal && (normalizeText(resVal.name) === normB || normName === normB)) {
            resolvedMap.set(normName, p);
          }
        }
      });
    }
  }

  // Đảm bảo LUÔN LUÔN trả về một Instance Map hợp lệ, không bao giờ null/undefined
  return resolvedMap || new Map();
};

/**
 * Get place details by name (caches and uses static dictionary/fallbacks)
 * Wraps getBulkPlacesDetails to maintain backwards compatibility.
 * @param {string} placeName - Name of the place/destination
 * @returns {Promise<Object>} The resolved place document
 */
const getPlaceDetails = async (placeName) => {
  if (!placeName || !String(placeName).trim()) {
    throw new Error('Tên địa điểm không được để trống');
  }

  const cleanName = String(placeName).trim();
  const resultMap = await getBulkPlacesDetails([cleanName]);
  return resultMap.get(normalizeText(cleanName)) || null;
};

module.exports = {
  getPlaceDetails,
  getBulkPlacesDetails,
};