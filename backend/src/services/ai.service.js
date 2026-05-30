const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generate a travel itinerary using Gemini AI.
 * @param {string} destination - The target destination
 * @param {number} durationDays - The duration of the trip in days
 * @param {number} budget - The budget for the trip
 * @param {Array<string>} preferences - User travel preferences
 * @param {Object} options - Additional options (startDate, people, travelStyle, interests, hotelArea)
 * @returns {Promise<Object>} The full AI response containing itinerary, hotel, and budget breakdown
 */
const generateItinerary = async (destination, durationDays, budget, preferences = [], options = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined. Falling back to mock itinerary.');
    return generateMockItinerary(destination, durationDays, budget, preferences);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash as the standard efficient model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const startDate = options.startDate || new Date().toISOString().split('T')[0];
    const people = options.people || 1;
    const travelStyle = options.travelStyle || (preferences.join(', ') || 'tự túc, trải nghiệm');
    const interests = options.interests || (preferences.join(', ') || 'ẩm thực, văn hóa, ngắm cảnh');
    const hotelArea = options.hotelArea || 'trung tâm thành phố hoặc gần các điểm du lịch chính';

    const prompt = `
Bạn là AI Travel Planner, một chuyên gia lên kế hoạch du lịch chuyên nghiệp.

Hãy tạo lịch trình du lịch cá nhân hóa chi tiết, thực tế và tối ưu theo thông tin sau:
- Địa điểm: ${destination}
- Ngày bắt đầu: ${startDate}
- Số ngày: ${durationDays}
- Số người: ${people}
- Ngân sách tổng cộng (VND): ${budget}
- Phong cách: ${travelStyle}
- Sở thích: ${interests}
- Khu vực muốn ở: ${hotelArea}

Yêu cầu chi tiết:
1. Phải trả về dữ liệu định dạng JSON hợp lệ duy nhất, tuân thủ cấu trúc JSON quy định bên dưới.
2. Có lịch trình chi tiết cho từng ngày (từ ngày 1 đến ngày ${durationDays}).
3. Mỗi ngày có các hoạt động cụ thể phân bổ theo giờ thực tế (không quá dày, để thời gian di chuyển hợp lý).
4. Mỗi hoạt động phải đi kèm chi phí ước tính (VND) hợp lý với điểm đến và ngân sách.
5. Đưa ra 1 gợi ý khách sạn phù hợp với khu vực muốn ở và ngân sách.
6. Đưa ra ít nhất 3 gợi ý quán ăn ngon, nổi bật và đặc sắc của địa phương tại điểm đến này.
7. Cung cấp bảng phân bổ ngân sách (budget breakdown) hợp lý cho toàn bộ chuyến đi bao gồm các hạng mục: accommodation (khách sạn), foodAndBeverage (ăn uống), activitiesAndEntranceFees (tham quan/vui chơi), transportation (di chuyển), và unforeseenExpenses (dự phòng). Tổng chi phí của các hạng mục này phải gần bằng ngân sách được cung cấp.
8. Các gợi ý là thông tin tham khảo, không cần chứa liên kết đặt chỗ (booking link).
9. Đảm bảo lịch trình thực tế, có thời gian nghỉ ngơi hợp lý, các điểm tham quan cùng ngày nằm trên các tuyến đường gần nhau để tránh mất nhiều thời gian di chuyển.

Cấu trúc JSON đầu ra bắt buộc:
{
  "destination": "tên địa điểm",
  "startDate": "ngày bắt đầu (YYYY-MM-DD)",
  "days": số ngày (number),
  "people": số người (number),
  "budget": tổng ngân sách (number),
  "travelStyle": "phong cách du lịch",
  "interests": "sở thích",
  "hotelArea": "khu vực muốn ở",
  "hotelRecommendation": {
    "name": "Tên khách sạn gợi ý",
    "address": "Địa chỉ khách sạn",
    "description": "Mô tả ngắn gọn lý do chọn khách sạn này",
    "estimatedCostPerNight": chi_phí_ước_tính_mỗi_đêm_bằng_số
  },
  "restaurantRecommendations": [
    {
      "name": "Tên quán ăn gợi ý",
      "cuisineType": "Ví dụ: Hải sản, Đặc sản Đà Nẵng, Món chay...",
      "averagePricePerPerson": chi_phí_trung_bình_mỗi_người_bằng_số,
      "rating": số_sao_đánh_giá_từ_1_đến_5,
      "address": "Địa chỉ quán ăn",
      "description": "Mô tả ngắn gọn về quán ăn và món ăn đặc trưng nên thử"
    }
  ],
  "budgetBreakdown": {
    "accommodation": chi_phí_nơi_ở_bằng_số,
    "foodAndBeverage": chi_phí_ăn_uống_bằng_số,
    "activitiesAndEntranceFees": chi_phí_vui_chơi_tham_quan_bằng_số,
    "transportation": chi_phí_di_chuyển_bằng_số,
    "unforeseenExpenses": chi_phí_dự_phòng_bằng_số
  },
  "itinerary": [
    {
      "day": 1,
      "date": "ngày theo định dạng YYYY-MM-DD",
      "theme": "Chủ đề chính của ngày này",
      "activities": [
        {
          "time": "Ví dụ: 08:00 AM hoặc 14:00",
          "location": "Tên địa điểm cụ thể",
          "description": "Mô tả chi tiết hoạt động tại đây",
          "cost": chi_phí_ước_tính_hoạt_động_này_bằng_số,
          "category": "Chọn một trong: FOOD (nếu là đi ăn uống), PLACE (nếu tham quan, vui chơi), HOTEL (checkin/checkout/nghỉ tại khách sạn), TRANSPORT (di chuyển bằng xe/tàu/máy bay), REST (nghỉ ngơi thư giãn), SHOPPING (mua sắm), OTHER",
          "transport": "Chọn một trong: WALKING, BIKE, CAR, BUS, TAXI, GRAB, OTHER để di chuyển tới điểm hoạt động này",
          "durationMinutes": số_phút_diễn_ra_hoạt_động_bằng_số
        }
      ]
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error generating itinerary with Gemini API:', error);
    return generateMockItinerary(destination, durationDays, budget, preferences);
  }
};

/**
 * Generate mock itinerary as fallback.
 */
const generateMockItinerary = (destination, durationDays, budget, preferences = []) => {
  console.log(`Generating mock itinerary for ${destination}...`);
  const itinerary = [];
  for (let i = 1; i <= durationDays; i++) {
    itinerary.push({
      day: i,
      date: new Date(Date.now() + (i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: `Khám phá ${destination} ngày ${i}`,
      activities: [
        {
          time: '09:00 AM',
          location: `Điểm tham quan nổi bật tại ${destination}`,
          description: `Tham quan buổi sáng dựa trên sở thích: ${preferences.join(', ') || 'ngắm cảnh'}.`,
          cost: Math.round(budget * 0.05),
          category: 'PLACE',
          transport: 'WALKING',
          durationMinutes: 120
        },
        {
          time: '01:00 PM',
          location: `Quán ăn địa phương nổi tiếng ở ${destination}`,
          description: `Ăn trưa ẩm thực địa phương đặc trưng.`,
          cost: Math.round(budget * 0.03),
          category: 'FOOD',
          transport: 'GRAB',
          durationMinutes: 60
        },
        {
          time: '04:00 PM',
          location: `Khu vui chơi hoặc bãi biển tại ${destination}`,
          description: `Thư giãn và ngắm hoàng hôn.`,
          cost: Math.round(budget * 0.04),
          category: 'PLACE',
          transport: 'WALKING',
          durationMinutes: 90
        }
      ]
    });
  }

  return {
    destination,
    startDate: new Date().toISOString().split('T')[0],
    days: durationDays,
    people: 1,
    budget,
    travelStyle: preferences.join(', ') || 'tự túc',
    interests: preferences.join(', ') || 'ngắm cảnh',
    hotelArea: 'Trung tâm',
    hotelRecommendation: {
      name: `Khách sạn 3 sao trung tâm ${destination}`,
      address: `Đường chính, trung tâm ${destination}`,
      description: `Khách sạn tiện nghi, gần các địa điểm ăn uống giải trí với chi phí hợp lý.`,
      estimatedCostPerNight: Math.round(budget * 0.15)
    },
    restaurantRecommendations: [
      {
        name: `Nhà hàng đặc sản ${destination}`,
        cuisineType: 'Ẩm thực địa phương',
        averagePricePerPerson: Math.round(budget * 0.04),
        rating: 4.5,
        address: `Khu phố ẩm thực, ${destination}`,
        description: `Quán ăn nổi tiếng với các món đặc sản truyền thống, giá cả bình dân.`
      },
      {
        name: `Quán hải sản biển ${destination}`,
        cuisineType: 'Hải sản tươi sống',
        averagePricePerPerson: Math.round(budget * 0.06),
        rating: 4.7,
        address: `Đường bờ biển, ${destination}`,
        description: `Không gian thoáng mát cạnh biển, phục vụ hải sản tươi ngon bắt tại hồ.`
      }
    ],
    budgetBreakdown: {
      accommodation: Math.round(budget * 0.3),
      foodAndBeverage: Math.round(budget * 0.25),
      activitiesAndEntranceFees: Math.round(budget * 0.2),
      transportation: Math.round(budget * 0.15),
      unforeseenExpenses: Math.round(budget * 0.1)
    },
    itinerary
  };
};

module.exports = {
  generateItinerary,
};
