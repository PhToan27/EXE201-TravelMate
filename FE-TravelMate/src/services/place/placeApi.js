import api from '../api';

/**
 * Get place details by place name
 * GET /api/places/detail?name=...
 * @param {string} name - Name of the place/destination
 */
export const getPlaceDetails = async (name) => {
  const response = await api.get('/places/detail', {
    params: { name },
  });
  return response.data;
};

/**
 * Get nearby places from coordinates
 * GET /api/places/nearby?lat=...&lng=...&excludeName=...&limit=...
 */
export const getNearbyPlaces = async (lat, lng, excludeName = '', limit = 5, type = '', destination = '') => {
  const response = await api.get('/places/nearby', {
    params: { lat, lng, excludeName, limit, type, destination },
  });
  return response.data;
};

const FALLBACK_PLACES = [
  { _id: 'fallback-1', name: 'Bãi biển Mỹ Khê', category: 'Điểm tham quan', address: 'Sơn Trà, Đà Nẵng', coordinates: { lat: 16.0544, lng: 108.2478 }, ticketPrice: 'Miễn phí', introduction: 'Bãi biển thoáng đãng, cát trắng mịn, phù hợp đi dạo, tắm biển và ngắm bình minh.' },
  { _id: 'fallback-2', name: 'Bán đảo Sơn Trà', category: 'Thiên nhiên', address: 'Sơn Trà, Đà Nẵng', coordinates: { lat: 16.1215, lng: 108.2812 }, ticketPrice: 'Miễn phí', introduction: 'Cung đường ven biển nhiều điểm ngắm cảnh, không khí trong lành.' },
  { _id: 'fallback-3', name: 'Chùa Linh Ứng Sơn Trà', category: 'Danh thắng tâm linh', address: 'Thọ Quang, Sơn Trà, Đà Nẵng', coordinates: { lat: 16.1002, lng: 108.2778 }, ticketPrice: 'Miễn phí', introduction: 'Tượng Phật Bà cao lớn, không gian yên bình và tầm nhìn đẹp.' },
  { _id: 'fallback-4', name: 'Ngũ Hành Sơn', category: 'Di tích quốc gia', address: '81 Huyền Trân Công Chúa, Hòa Hải, Ngũ Hành Sơn, Đà Nẵng', coordinates: { lat: 16.0032, lng: 108.2639 }, ticketPrice: '40.000 VNĐ', introduction: 'Danh thắng nổi tiếng của Đà Nẵng, gồm nhiều ngọn núi đá vôi, hang động và chùa chiền.' },
  { _id: 'fallback-5', name: 'Bà Nà Hills', category: 'Khu du lịch sinh thái & vui chơi', address: 'Hòa Phú, Hòa Vang, Đà Nẵng', coordinates: { lat: 15.9984, lng: 107.9968 }, ticketPrice: '900.000 VNĐ', introduction: 'Cầu Vàng, làng Pháp, khí hậu mát mẻ và hệ thống cáp treo dài.' },
  { _id: 'fallback-6', name: 'Cầu Rồng', category: 'Biểu tượng thành phố', address: 'Đường Nguyễn Văn Linh, Hải Châu, Đà Nẵng', coordinates: { lat: 16.0611, lng: 108.2272 }, ticketPrice: 'Miễn phí', introduction: 'Biểu tượng hiện đại của Đà Nẵng, nổi bật với thiết kế hình rồng vươn ra biển.' },
  { _id: 'fallback-7', name: 'Hồ Gươm và đền Ngọc Sơn', category: 'Văn hóa', address: 'Hoàn Kiếm, Hà Nội', coordinates: { lat: 21.0306, lng: 105.8522 }, ticketPrice: '50.000 VNĐ / người', introduction: 'Biểu tượng trung tâm Hà Nội, phù hợp đi bộ thư thả và chụp ảnh.' },
  { _id: 'fallback-8', name: 'Văn Miếu - Quốc Tử Giám', category: 'Lịch sử', address: 'Đống Đa, Hà Nội', coordinates: { lat: 21.0278, lng: 105.8355 }, ticketPrice: '70.000 VNĐ / người', introduction: 'Không gian cổ kính để tìm hiểu về truyền thống hiếu học của Việt Nam.' },
  { _id: 'fallback-9', name: 'Bãi Sao', category: 'Biển', address: 'An Thới, Phú Quốc, Kiên Giang', coordinates: { lat: 10.032, lng: 104.034 }, ticketPrice: 'Miễn phí', introduction: 'Bãi biển cát sáng và nước trong, thích hợp nghỉ ngơi và tắm biển.' },
  { _id: 'fallback-10', name: 'Hồ Xuân Hương', category: 'Thư giãn', address: 'Đà Lạt, Lâm Đồng', coordinates: { lat: 11.9416, lng: 108.4385 }, ticketPrice: 'Miễn phí', introduction: 'Không gian thoáng mát giữa trung tâm Đà Lạt, phù hợp đi dạo.' },
  { _id: 'fallback-11', name: 'Mì Quảng Bà Mua', category: 'Ẩm thực', address: '95A Nguyễn Tri Phương, Thanh Khê, Đà Nẵng', coordinates: { lat: 16.0678, lng: 108.2039 }, ticketPrice: '30.000 - 60.000 VNĐ', introduction: 'Quán mì Quảng lâu đời với nhiều hương vị đậm chất miền Trung.' },
  { _id: 'fallback-12', name: 'Bánh tráng cuốn thịt heo Trần', category: 'Ẩm thực', address: '4 Lê Duẩn, Hải Châu, Đà Nẵng', coordinates: { lat: 16.0716, lng: 108.2226 }, ticketPrice: '80.000 - 150.000 VNĐ', introduction: 'Thương hiệu đặc sản bánh tráng thịt heo nổi tiếng nhất Đà Nẵng.' }
];

/**
 * Search places by name/address keyword
 * GET /api/places/search?q=...&limit=...
 */
export const searchPlaces = async (query, limit = 10) => {
  try {
    const response = await api.get('/places/search', {
      params: { q: query, limit },
    });
    return response.data;
  } catch (error) {
    console.warn('searchPlaces API call failed, using client-side fallback list:', error.message);
    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    const filtered = FALLBACK_PLACES.filter(place => {
      const nameNorm = place.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
      const addressNorm = place.address.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
      return nameNorm.includes(normalizedQuery) || addressNorm.includes(normalizedQuery);
    }).slice(0, limit);
    return {
      success: true,
      data: filtered
    };
  }
};


