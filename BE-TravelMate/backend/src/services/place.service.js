const Place = require('../models/Place');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Static fallbacks for popular Da Nang locations to guarantee instant response and avoid model demand issues
const POPULAR_PLACES = {
  'ngũ hành sơn': {
    name: 'Ngũ Hành Sơn',
    category: 'Di tích quốc gia',
    rating: 4.8,
    reviewsCount: '1.2k',
    duration: '2-3 giờ',
    difficulty: 'Trung bình',
    introduction: 'Ngũ Hành Sơn là một danh thắng gồm 5 ngọn núi đá vôi nhô lên trên bãi cát ven biển: Kim Sơn, Mộc Sơn, Thủy Sơn, Hỏa Sơn và Thổ Sơn. Nơi đây hội tụ vẻ đẹp tâm linh với các hang động huyền bí và chùa chiền cổ kính.',
    address: '81 Huyền Trân Công Chúa, Hòa Hải, Ngũ Hành Sơn, Đà Nẵng',
    openHours: '07:00 - 17:30 (Hàng ngày)',
    ticketPrice: '40.000 VNĐ / Người lớn\n*Thang máy: 15.000 VNĐ/lượt',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 16.003182, lng: 108.263884 }
  },
  'bà nà hills': {
    name: 'Bà Nà Hills',
    category: 'Khu du lịch sinh thái & vui chơi',
    rating: 4.7,
    reviewsCount: '15k',
    duration: 'Nửa ngày',
    difficulty: 'Dễ',
    introduction: 'Bà Nà Hills nằm ở độ cao 1.487m so với mực nước biển, nổi tiếng với Cầu Vàng (Golden Bridge) nâng đỡ bởi hai bàn tay khổng lồ, Làng Pháp cổ kính cùng hệ thống cáp treo đạt nhiều kỷ lục thế giới.',
    address: 'Hòa Phú, Hòa Vang, Đà Nẵng',
    openHours: '08:00 - 22:00 (Hàng ngày)',
    ticketPrice: '900.000 VNĐ / Người lớn\n(Đã bao gồm cáp treo & các trò chơi)',
    imageUrl: 'https://images.unsplash.com/photo-15555244162-803834f70033?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 15.9984, lng: 107.9968 }
  },
  'chùa linh ứng': {
    name: 'Chùa Linh Ứng Sơn Trà',
    category: 'Danh thắng tâm linh',
    rating: 4.8,
    reviewsCount: '4.5k',
    duration: '2-3 giờ',
    difficulty: 'Dễ',
    introduction: 'Chùa Linh Ứng Bãi Bụt Sơn Trà là một trong ba ngôi chùa Linh Ứng nổi tiếng tại Đà Nẵng. Nơi đây sở hữu bức tượng Phật Bà Quan Thế Âm cao 67m, hướng mặt ra biển và tựa lưng vào bán đảo Sơn Trà hùng vĩ.',
    address: 'Thọ Quang, Sơn Trà, Đà Nẵng',
    openHours: '06:00 - 21:00 (Hàng ngày)',
    ticketPrice: 'Miễn phí (Tự nguyện công đức)',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 16.1002, lng: 108.2778 }
  },
  'bán đảo sơn trà': {
    name: 'Bán đảo Sơn Trà',
    category: 'Danh thắng tự nhiên',
    rating: 4.7,
    reviewsCount: '3.2k',
    duration: 'Nửa ngày',
    difficulty: 'Trung bình',
    introduction: 'Bán đảo Sơn Trà được ví như viên ngọc quý của Đà Nẵng với hệ sinh thái rừng tự nhiên đa dạng, những bãi biển hoang sơ tuyệt đẹp như Bãi Bụt, Bãi Rạng và là nơi sinh sống của loài Voọc chà vá chân nâu quý hiếm.',
    address: 'Sơn Trà, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: 'Miễn phí',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 16.1205, lng: 108.2912 }
  },
  'cầu rồng': {
    name: 'Cầu Rồng',
    category: 'Biểu tượng thành phố',
    rating: 4.8,
    reviewsCount: '8k',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Cầu Rồng là một trong những biểu tượng nổi bật nhất của thành phố Đà Nẵng. Cầu được thiết kế theo hình dáng con rồng thời Lý hướng ra biển, đặc biệt có khả năng phun lửa và phun nước vào 21:00 thứ Bảy và Chủ Nhật hàng tuần.',
    address: 'Đường Nguyễn Văn Linh, Phước Ninh, Hải Châu, Đà Nẵng',
    openHours: 'Mở cửa cả ngày (Phun lửa/nước lúc 21:00 cuối tuần)',
    ticketPrice: 'Miễn phí',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80',
    coordinates: { lat: 16.0611, lng: 108.2272 }
  }
};

const getUnsplashImage = (placeName, category) => {
  const norm = placeName.toLowerCase();
  if (norm.includes('biển') || norm.includes('bãi') || norm.includes('vịnh') || norm.includes('đảo')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'; // Beach
  }
  if (norm.includes('chùa') || norm.includes('đền') || norm.includes('di tích') || norm.includes('tháp') || norm.includes('lăng')) {
    return 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80'; // Culture / Historic
  }
  if (norm.includes('ăn') || norm.includes('nhà hàng') || norm.includes('quán') || norm.includes('chợ')) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80'; // Food / Market
  }
  // Default general beautiful travel scenery
  return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80';
};

/**
 * Get place details. First searches MongoDB.
 * If not cached, checks popular local dictionary.
 * If still not found, queries Gemini AI to generate details dynamically.
 */
const getPlaceDetails = async (placeName) => {
  if (!placeName) {
    throw new Error('Tên địa điểm không được để trống');
  }

  const cleanName = placeName.trim();
  const searchName = cleanName.toLowerCase();

  // 1. Search database first
  let place = await Place.findOne({ name: { $regex: new RegExp('^' + cleanName + '$', 'i') } });
  if (place) {
    console.log(`Retrieved place "${cleanName}" from MongoDB cache.`);
    return place;
  }

  // 2. Search popular static dictionary
  const key = Object.keys(POPULAR_PLACES).find(k => searchName.includes(k) || k.includes(searchName));
  if (key) {
    console.log(`Retrieved place "${cleanName}" from static dictionary.`);
    const seed = POPULAR_PLACES[key];
    place = await Place.create(seed);
    return place;
  }

  // 3. Fallback to Gemini AI generation
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined. Falling back to default place template.');
    return generateDefaultPlace(cleanName);
  }

  try {
    console.log(`Generating place details via Gemini for: "${cleanName}"...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const prompt = `
Bạn là AI chuyên gia du lịch. Hãy cung cấp thông tin chi tiết, chính xác và trực quan bằng tiếng Việt cho địa điểm sau: "${cleanName}".

Yêu cầu chi tiết:
1. Trả về định dạng JSON hợp lệ duy nhất.
2. Trích xuất hoặc tự tìm thông tin chính xác về địa điểm này.
3. Các trường cần trả về:
   - "category": Phân loại ngắn gọn (ví dụ: "Di tích lịch sử", "Danh thắng tự nhiên", "Khu vui chơi", "Bãi biển", "Ẩm thực địa phương", v.v.).
   - "rating": Điểm đánh giá thực tế hoặc ước lượng hợp lý (từ 1.0 đến 5.0, kiểu số thực, ví dụ 4.8).
   - "reviewsCount": Số lượng đánh giá ước lượng (ví dụ: "1.2k", "500+", "10k+").
   - "duration": Thời gian tham quan khuyến nghị (ví dụ: "2-3 giờ", "nửa ngày", "1-2 giờ").
   - "difficulty": Độ khó khi tham quan (chọn 1 trong: "Dễ", "Trung bình", "Khó").
   - "introduction": Giới thiệu chi tiết khoảng 3-5 câu về vẻ đẹp lịch sử, tâm linh, văn hóa hoặc trải nghiệm tại địa điểm này.
   - "address": Địa chỉ cụ thể.
   - "openHours": Giờ mở cửa hàng ngày (ví dụ: "07:00 - 17:30 (Hàng ngày)").
   - "ticketPrice": Giá vé chi tiết (ví dụ: "40.000 VNĐ / Người lớn. +Thang máy: 15.000 VNĐ/lượt" hoặc "Miễn phí").
   - "coordinates": Đối tượng chứa "lat" (vĩ độ) và "lng" (kinh độ) chính xác hoặc xấp xỉ của địa điểm đó. Ví dụ: { "lat": 16.0028, "lng": 108.2618 }.

JSON cấu trúc:
{
  "category": "...",
  "rating": ...,
  "reviewsCount": "...",
  "duration": "...",
  "difficulty": "...",
  "introduction": "...",
  "address": "...",
  "openHours": "...",
  "ticketPrice": "...",
  "coordinates": {
    "lat": ...,
    "lng": ...
  }
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // Dynamic Image assignment
    const imageUrl = getUnsplashImage(cleanName, data.category || '');

    const newPlace = await Place.create({
      name: cleanName,
      category: data.category || 'Địa điểm tham quan',
      rating: Number(data.rating) || 4.5,
      reviewsCount: data.reviewsCount || '100+',
      duration: data.duration || '1-2 giờ',
      difficulty: data.difficulty || 'Dễ',
      introduction: data.introduction || `Khám phá vẻ đẹp độc đáo tại ${cleanName}.`,
      address: data.address || `${cleanName}, Việt Nam`,
      openHours: data.openHours || 'Mở cửa cả ngày',
      ticketPrice: data.ticketPrice || 'Miễn phí',
      imageUrl,
      coordinates: {
        lat: Number(data.coordinates?.lat) || 16.0544,
        lng: Number(data.coordinates?.lng) || 108.2022
      }
    });

    console.log(`Saved newly generated place details for "${cleanName}" into MongoDB.`);
    return newPlace;

  } catch (error) {
    console.error(`Gemini Place generation error for "${cleanName}":`, error);
    // Use fallback to avoid crash
    return generateDefaultPlace(cleanName);
  }
};

/**
 * Generate a default place structure when Gemini API fails
 */
const generateDefaultPlace = async (placeName) => {
  const imageUrl = getUnsplashImage(placeName, '');
  const fallbackDetails = {
    name: placeName,
    category: 'Điểm tham quan',
    rating: 4.5,
    reviewsCount: '100+',
    duration: '1-2 giờ',
    difficulty: 'Dễ',
    introduction: `${placeName} là địa điểm du lịch lý thú và hấp dẫn, thu hút nhiều khách tham quan trong nước và quốc tế đến trải nghiệm văn hóa ẩm thực và đời sống bản địa độc đáo.`,
    address: `${placeName}, Việt Nam`,
    openHours: '08:00 - 18:00 (Hàng ngày)',
    ticketPrice: 'Miễn phí hoặc thay đổi tùy thời điểm',
    imageUrl,
    coordinates: {
      lat: 16.0544 + (Math.random() - 0.5) * 0.05,
      lng: 108.2022 + (Math.random() - 0.5) * 0.05
    }
  };

  try {
    const defaultPlace = await Place.create(fallbackDetails);
    return defaultPlace;
  } catch (e) {
    // If double creation conflicts or database fails, just return raw JS object
    return fallbackDetails;
  }
};

module.exports = {
  getPlaceDetails,
};
