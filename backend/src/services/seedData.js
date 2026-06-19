const User = require('../models/User');
const Post = require('../models/Post');
const AdminSetting = require('../models/AdminSetting');
const Trip = require('../models/Trip');
const ItineraryTemplate = require('../models/ItineraryTemplate');
const Place = require('../models/Place');

let itineraryTemplates = [];
try {
  itineraryTemplates = require('../data/itineraryTemplates');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') {
    throw error;
  }
  console.log('Itinerary template seed file not found. Skipping template seeding.');
}
const itineraryPreviewPlaces = require('../data/itineraryPreviewPlaces');

const seedItineraryTemplates = async () => {
  if (!itineraryTemplates.length) {
    return;
  }

  const activeKeys = itineraryTemplates.map((template) => template.destinationKey);

  await ItineraryTemplate.deleteMany({
    destinationKey: { $nin: activeKeys },
  });

  await ItineraryTemplate.bulkWrite(
    itineraryTemplates.map((template) => ({
      updateOne: {
        filter: {
          destinationKey: template.destinationKey,
          travelStyleKey: template.travelStyleKey || 'GENERAL',
        },
        update: { $set: template },
        upsert: true,
      },
    }))
  );

  console.log(`Itinerary templates upserted: ${itineraryTemplates.length}`);
};

const seedItineraryPreviewPlaces = async () => {
  await Promise.all(
    itineraryPreviewPlaces.map((place) =>
      Place.updateOne({ name: place.name }, { $set: place }, { upsert: true })
    )
  );
  console.log(`Preview places upserted: ${itineraryPreviewPlaces.length}`);
};

const RESTAURANT_SEEDS = [
  // Đà Nẵng
  {
    name: 'Bánh tráng cuốn thịt heo Trần',
    category: 'Ẩm thực',
    rating: 4.6,
    reviewsCount: '1k+',
    duration: '45 phút - 1 giờ',
    difficulty: 'Dễ',
    introduction: 'Thương hiệu đặc sản bánh tráng thịt heo nổi tiếng nhất Đà Nẵng với nước chấm nêm đặc trưng cực kỳ đậm đà.',
    address: '4 Lê Duẩn, Hải Châu, Đà Nẵng',
    openHours: '09:00 - 22:00',
    ticketPrice: '80.000 - 150.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    coordinates: { lat: 16.0716, lng: 108.2226 }
  },
  {
    name: 'Mì Quảng Bà Mua',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '800+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán mì Quảng lâu đời với nhiều hương vị như mì gà, mì tôm thịt, mì ếch đậm chất miền Trung.',
    address: '95A Nguyễn Tri Phương, Thanh Khê, Đà Nẵng',
    openHours: '06:00 - 22:00',
    ticketPrice: '30.000 - 60.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 16.0678, lng: 108.2039 }
  },
  {
    name: 'Bún chả cá Ông Tạ',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '500+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán bún chả cá gia truyền nức tiếng với chả cá thu thơm ngon, nước lèo ngọt thanh từ xương cá và rau củ.',
    address: '113A Nguyễn Chí Thanh, Hải Châu, Đà Nẵng',
    openHours: '07:00 - 22:00',
    ticketPrice: '35.000 - 55.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    coordinates: { lat: 16.0754, lng: 108.2201 }
  },
  {
    name: 'Hải sản Năm Đảnh',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '2k+',
    duration: '1 - 2 giờ',
    difficulty: 'Dễ',
    introduction: 'Quán hải sản bình dân nằm sâu trong hẻm nhưng lúc nào cũng đông nghịt khách nhờ hải sản tươi sống giá rất rẻ.',
    address: '139/59/38 Trần Quang Khải, Sơn Trà, Đà Nẵng',
    openHours: '10:00 - 20:30',
    ticketPrice: '60.000 - 120.000 VNĐ / món',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    coordinates: { lat: 16.1032, lng: 108.2612 }
  },
  {
    name: 'Bánh xèo Bà Dưỡng',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.5k+',
    duration: '45 phút - 1 giờ',
    difficulty: 'Dễ',
    introduction: 'Bánh xèo vỏ giòn rụm ăn kèm nước tương gan béo ngậy độc nhất vô nhị tại Đà Nẵng.',
    address: 'K280/21 Hoàng Diệu, Hải Châu, Đà Nẵng',
    openHours: '09:00 - 21:30',
    ticketPrice: '20.000 - 80.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    coordinates: { lat: 16.0594, lng: 108.2163 }
  },
  {
    name: 'Quán hải sản Bé Mặn',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '3k+',
    duration: '1 - 2 giờ',
    difficulty: 'Dễ',
    introduction: 'Nhà hàng hải sản ven biển Mỹ Khê sầm uất, nơi thực khách tự tay chọn hải sản sống tại bể.',
    address: 'Lô 11 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
    openHours: '09:00 - 23:00',
    ticketPrice: '150.000 - 500.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    coordinates: { lat: 16.0792, lng: 108.2483 }
  },
  {
    name: 'Mì Quảng Ếch Bếp Trang',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '900+',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Món mì Quảng ếch được bày trí trên mẹt tre độc đáo, thịt ếch om đậm đà cay nồng cực hấp dẫn.',
    address: '24 Lê Hồng Phong, Hải Châu, Đà Nẵng',
    openHours: '07:00 - 22:00',
    ticketPrice: '50.000 - 100.000 VNĐ / phần',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 16.0645, lng: 108.2215 }
  },
  {
    name: 'Cơm gà A Hải',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '1.1k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Cơm gà quay giòn bì nổi tiếng bậc nhất Đà Nẵng, miếng gà to đùng đùi hoặc cánh kèm nước sốt béo ngậy.',
    address: '96 Phan Châu Trinh, Hải Châu, Đà Nẵng',
    openHours: '08:30 - 22:00',
    ticketPrice: '45.000 - 70.000 VNĐ / suất',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    coordinates: { lat: 16.0664, lng: 108.2198 }
  },
  {
    name: 'Chè Liên Đà Nẵng',
    category: 'Ẩm thực',
    rating: 4.6,
    reviewsCount: '4k+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Món chè sầu Liên béo ngậy nước cốt dừa, thạch lá dứa và múi sầu riêng tươi ngon đã trở thành huyền thoại.',
    address: '189 Hoàng Diệu, Hải Châu, Đà Nẵng',
    openHours: '08:00 - 22:00',
    ticketPrice: '20.000 - 35.000 VNĐ / ly',
    imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800',
    coordinates: { lat: 16.0581, lng: 108.2159 }
  },
  {
    name: 'Bánh tráng kẹp Dì Hoa',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '700+',
    duration: '30 - 45 phút',
    difficulty: 'Dễ',
    introduction: 'Bánh tráng kẹp trứng, pate, khô bò nướng giòn rụm chấm nước sốt bò rim sền sệt siêu ngon bổ rẻ.',
    address: '62/2A Núi Thành, Hải Châu, Đà Nẵng',
    openHours: '14:30 - 22:00',
    ticketPrice: '15.000 - 25.000 VNĐ / dĩa',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    coordinates: { lat: 16.0549, lng: 108.2208 }
  },
  {
    name: 'Kem bơ Cô Vân chợ Bắc Mỹ An',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.2k+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Quán kem bơ đông khách nhất chợ, bơ xay dẻo mịn ăn kèm kem dừa thủ công và dừa nạo sấy giòn tan.',
    address: 'Chợ Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng',
    openHours: '07:00 - 18:00',
    ticketPrice: '15.000 - 20.000 VNĐ / ly',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    coordinates: { lat: 16.0461, lng: 108.2411 }
  },

  // Hà Nội
  {
    name: 'Phở Thìn Bờ Hồ',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.2k+',
    duration: '30 - 45 phút',
    difficulty: 'Dễ',
    introduction: 'Hương vị phở bò truyền thống thanh tao của người Hà Nội cổ truyền ngay bên Hồ Gươm.',
    address: '61 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội',
    openHours: '06:00 - 21:00',
    ticketPrice: '50.000 - 70.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    coordinates: { lat: 21.0305, lng: 105.8524 }
  },
  {
    name: 'Bún chả Hương Liên (Obama)',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '2.5k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Địa điểm bún chả nổi tiếng thế giới nơi cựu Tổng thống Mỹ Obama từng ghé ăn.',
    address: '24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội',
    openHours: '08:00 - 20:30',
    ticketPrice: '50.000 - 90.000 VNĐ / suất',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    coordinates: { lat: 21.0185, lng: 105.8543 }
  },
  {
    name: 'Phở Gia Truyền Bát Đàn',
    category: 'Ẩm thực',
    rating: 4.6,
    reviewsCount: '1.8k+',
    duration: '30 - 45 phút',
    difficulty: 'Dễ',
    introduction: 'Hàng phở xếp hàng nổi tiếng nhất phố cổ Hà Nội với nước dùng thơm lừng chuẩn vị phở cổ xưa.',
    address: '49 Bát Đàn, Hoàn Kiếm, Hà Nội',
    openHours: '06:00 - 10:00 & 18:00 - 20:30',
    ticketPrice: '55.000 - 75.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    coordinates: { lat: 21.0321, lng: 105.8454 }
  },
  {
    name: 'Chả cá Lã Vọng',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '1k+',
    duration: '1 - 1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Món chả cá lăng nướng chảo gia truyền có tuổi đời hơn một thế kỷ tại Hà Nội.',
    address: '14 Chả Cả, Hoàn Kiếm, Hà Nội',
    openHours: '11:00 - 14:00 & 17:00 - 21:00',
    ticketPrice: '150.000 - 200.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    coordinates: { lat: 21.0347, lng: 105.8488 }
  },
  {
    name: 'Café Giảng (Cà phê trứng)',
    category: 'Ẩm thực',
    rating: 4.6,
    reviewsCount: '3k+',
    duration: '45 phút - 1 giờ',
    difficulty: 'Dễ',
    introduction: 'Nơi khai sinh ra món Cà phê trứng béo ngậy huyền thoại của thủ đô Hà Nội.',
    address: '39 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội',
    openHours: '07:00 - 22:00',
    ticketPrice: '30.000 - 50.000 VNĐ / ly',
    imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800',
    coordinates: { lat: 21.0331, lng: 105.8548 }
  },
  {
    name: 'Phở cuốn Hưng Bền Ngũ Xã',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '800+',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Một trong những quán đầu tiên bán phở cuốn tại khu Ngũ Xã, cuốn bò xào đậm đà chấm nước mắm tỏi ớt cực ngon.',
    address: '33 Ngũ Xã, Ba Đình, Hà Nội',
    openHours: '09:00 - 23:00',
    ticketPrice: '60.000 - 120.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 21.0454, lng: 105.8398 }
  },
  {
    name: 'Bánh tôm Hồ Tây',
    category: 'Ẩm thực',
    rating: 4.2,
    reviewsCount: '1.5k+',
    duration: '1 - 1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Thưởng thức bánh tôm giòn tan bọc khoai lang bào sợi, nhìn ngắm hoàng hôn Hồ Tây thơ mộng.',
    address: '1 Thanh Niên, Tây Hồ, Hà Nội',
    openHours: '09:00 - 22:00',
    ticketPrice: '80.000 - 150.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    coordinates: { lat: 21.0435, lng: 105.8351 }
  },
  {
    name: 'Kem Tràng Tiền',
    category: 'Ẩm thực',
    rating: 4.6,
    reviewsCount: '5k+',
    duration: '20 phút',
    difficulty: 'Dễ',
    introduction: 'Hương vị kem ốc quế cốm, đậu xanh, dừa truyền thống gắn liền với tuổi thơ bao thế hệ người Hà Nội.',
    address: '35 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    openHours: '07:30 - 23:00',
    ticketPrice: '12.000 - 25.000 VNĐ / chiếc',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    coordinates: { lat: 21.0253, lng: 105.8569 }
  },
  {
    name: 'Xôi Yến Nguyễn Hữu Huân',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '2k+',
    duration: '30 - 45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán xôi xéo, xôi ngô xôi khúc nức tiếng đi kèm đĩa thịt kho tàu, pate, chả, trứng kiến béo ngậy.',
    address: '35B Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội',
    openHours: '06:00 - 23:30',
    ticketPrice: '35.000 - 65.000 VNĐ / suất',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    coordinates: { lat: 21.0332, lng: 105.8546 }
  },
  {
    name: 'Bún riêu cua Hàng Bạc',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '600+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Gánh bún riêu vỉa hè nhỏ nhưng đông đúc ở phố cổ, vị gạch cua nguyên chất chưng dầu rực rỡ.',
    address: '11 Hàng Bạc, Hoàn Kiếm, Hà Nội',
    openHours: '06:00 - 18:00',
    ticketPrice: '30.000 - 50.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    coordinates: { lat: 21.0339, lng: 105.8519 }
  },

  // Hồ Chí Minh / Sài Gòn
  {
    name: 'Phở Lệ Võ Văn Tần',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '2k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Hàng phở Nam bộ nổi tiếng nhất Sài Gòn với nước dùng ngọt đậm đà, thịt bò tái gàu gân tươi ngon.',
    address: '370 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh',
    openHours: '06:00 - 23:00',
    ticketPrice: '75.000 - 90.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    coordinates: { lat: 10.7584, lng: 106.6789 }
  },
  {
    name: 'Hủ tiếu Nam Vang Nhân Quán',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '1.5k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Thương hiệu hủ tiếu Nam Vang trứ danh với đĩa hủ tiếu khô trộn nước sốt độc quyền kèm tôm thịt xá xíu trứng cút.',
    address: '122D Cách Mạng Tháng 8, Quận 3, TP. Hồ Chí Minh',
    openHours: '00:00 - 23:59',
    ticketPrice: '65.000 - 90.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 10.7785, lng: 106.6854 }
  },
  {
    name: 'Bột chiên Đạt Thành',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '800+',
    duration: '30 - 45 phút',
    difficulty: 'Dễ',
    introduction: 'Bột chiên trứng kiểu Hoa giòn ngoài mềm trong ăn kèm đồ chua và nước tương pha ngọt ngọt cay cay.',
    address: '277 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh',
    openHours: '14:00 - 22:00',
    ticketPrice: '30.000 - 45.000 VNĐ / dĩa',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    coordinates: { lat: 10.7725, lng: 106.6841 }
  },
  {
    name: 'Bánh mì Huỳnh Hoa',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '3.5k+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Bánh mì đắt đỏ và nổi tiếng nhất Sài Gòn, ngập tràn chà bông, pate bơ, chả lụa, dăm bông nặng trĩu tay.',
    address: '26 Lê Thị Riêng, Quận 1, TP. Hồ Chí Minh',
    openHours: '13:00 - 22:00',
    ticketPrice: '58.000 - 65.000 VNĐ / ổ',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
    coordinates: { lat: 10.7721, lng: 106.6923 }
  },
  {
    name: 'Cơm tấm Ba Ghiền',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '2.5k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán cơm tấm đạt sao Michelin với miếng sườn nướng khổng lồ che lấp cả đĩa cơm, ướp gia vị siêu thấm.',
    address: '84 Đặng Văn Ngữ, Phú Nhuận, TP. Hồ Chí Minh',
    openHours: '07:30 - 21:00',
    ticketPrice: '70.000 - 120.000 VNĐ / dĩa',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    coordinates: { lat: 10.7963, lng: 106.6729 }
  },
  {
    name: 'Bánh xèo Ăn Là Ghiền',
    category: 'Ẩm thực',
    rating: 4.2,
    reviewsCount: '1k+',
    duration: '1 - 1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Nhà hàng bánh xèo Nam bộ mỏng giòn rụm với đa dạng nhân tôm thịt, nấm, trứng bọc rau sống bản lớn xanh mướt.',
    address: '74 Sương Nguyệt Ánh, Quận 1, TP. Hồ Chí Minh',
    openHours: '09:00 - 22:00',
    ticketPrice: '90.000 - 150.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    coordinates: { lat: 10.7712, lng: 106.6894 }
  },
  {
    name: 'Ốc Đào Nguyễn Trãi',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '1.8k+',
    duration: '1 - 2 giờ',
    difficulty: 'Dễ',
    introduction: 'Thiên đường ốc sài gòn với hàng chục món ốc hương xào bơ tỏi, sò huyết xào me, ốc tỏi nướng mỡ hành đậm đà.',
    address: '212B/D28 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
    openHours: '11:00 - 22:30',
    ticketPrice: '50.000 - 150.000 VNĐ / món',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    coordinates: { lat: 10.7681, lng: 106.6874 }
  },
  {
    name: 'Bánh tráng trộn Chú Viên',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '900+',
    duration: '20 phút',
    difficulty: 'Dễ',
    introduction: 'Bánh tráng trộn lâu đời nhất phố ăn vặt Nguyễn Thượng Hiền, gói nước sốt bò rim chua ngọt đậm đà không lẫn đi đâu được.',
    address: '38 Nguyễn Thượng Hiền, Quận 3, TP. Hồ Chí Minh',
    openHours: '11:30 - 21:00',
    ticketPrice: '25.000 - 40.000 VNĐ / phần',
    imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800',
    coordinates: { lat: 10.7765, lng: 106.6821 }
  },
  {
    name: 'Súp cua Hạnh chợ Tân Định',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '700+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Tô súp cua sánh đặc nhiều thịt cua tươi, óc heo, trứng bắc thảo béo ngậy được người dân bản địa cực kỳ ưa chuộng.',
    address: 'Chợ Tân Định, Quận 1, TP. Hồ Chí Minh',
    openHours: '06:00 - 21:00',
    ticketPrice: '30.000 - 55.000 VNĐ / phần',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 10.7891, lng: 106.6901 }
  },
  {
    name: 'Cơm gà Đông Nguyên',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '1.2k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán cơm gà Hải Nam kiểu Hoa lâu đời trứ danh Chợ Lớn với đĩa thịt gà luộc vàng bóng da giòn ngậy thơm.',
    address: '801 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh',
    openHours: '09:00 - 21:00',
    ticketPrice: '60.000 - 110.000 VNĐ / phần',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    coordinates: { lat: 10.7535, lng: 106.6631 }
  },

  // Đà Lạt
  {
    name: 'Lẩu gà lá é Tao Ngộ',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '2k+',
    duration: '1 - 1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Món lẩu gà lá é cay nồng thích hợp thưởng thức trong không khí se lạnh của Đà Lạt.',
    address: '5 Đường 3/4, Phường 3, Đà Lạt',
    openHours: '08:00 - 23:00',
    ticketPrice: '200.000 - 350.000 VNĐ / nồi',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 11.9315, lng: 108.4412 }
  },
  {
    name: 'Lẩu bò Ba Toa Quán Gỗ',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '1.5k+',
    duration: '1 - 1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Hương vị lẩu bò dầy thịt, nước lèo xương hầm thơm lừng tại căn nhà gỗ mộc mạc.',
    address: '1/29 Hoàng Diệu, Phường 5, Đà Lạt',
    openHours: '10:00 - 22:00',
    ticketPrice: '150.000 - 300.000 VNĐ / nồi',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    coordinates: { lat: 11.9421, lng: 108.4312 }
  },
  {
    name: 'Kem bơ Thanh Thảo',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '1.2k+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Món kem bơ xay sánh mịn ăn cùng một viên kem dừa béo ngậy nức tiếng du lịch Đà Lạt.',
    address: '76 Nguyễn Văn Trỗi, Phường 2, Đà Lạt',
    openHours: '09:00 - 22:00',
    ticketPrice: '20.000 - 40.000 VNĐ / ly',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    coordinates: { lat: 11.9463, lng: 108.4394 }
  },
  {
    name: 'Bánh mì xíu mại Hoàng Diệu',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.6k+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Món ăn sáng quốc dân Đà Lạt: chén xíu mại nước lèo da heo, giò chả thơm lừng ăn kèm bánh mì giòn nóng.',
    address: '26 Hoàng Diệu, Phường 5, Đà Lạt',
    openHours: '06:00 - 10:00',
    ticketPrice: '15.000 - 25.000 VNĐ / chén',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
    coordinates: { lat: 11.9428, lng: 108.4308 }
  },
  {
    name: 'Bánh ướt lòng gà Long',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '1k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Đặc sản bánh ướt mềm dai ăn chung lòng mề heo, thịt gà xé phay giòn dai trộn nước mắm chua ngọt lạ miệng.',
    address: 'Hẻm 202 Phan Đình Phùng, Phường 2, Đà Lạt',
    openHours: '07:00 - 19:00',
    ticketPrice: '35.000 - 50.000 VNĐ / dĩa',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    coordinates: { lat: 11.9482, lng: 108.4378 }
  },
  {
    name: 'Nem nướng Bà Hùng',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '1.1k+',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Nem nướng nóng hổi ăn kèm bánh tráng chiên giòn, đồ chua, và chén nước tương đậu phộng chưng nóng ấm.',
    address: '328 Phan Đình Phùng, Phường 2, Đà Lạt',
    openHours: '11:00 - 21:00',
    ticketPrice: '45.000 - 60.000 VNĐ / suất',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    coordinates: { lat: 11.9515, lng: 108.4352 }
  },
  {
    name: 'Bánh căn Lệ Yersin',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.4k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán bánh căn đúc khuôn đất nung truyền thống nhân trứng cút hay thịt bò chấm bát nước mắm xíu mại da heo ngập hành.',
    address: '27/44 Yersin, Phường 10, Đà Lạt',
    openHours: '08:00 - 18:00',
    ticketPrice: '25.000 - 45.000 VNĐ / dĩa',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    coordinates: { lat: 11.9398, lng: 108.4524 }
  },
  {
    name: 'Quán nướng Chu',
    category: 'Ẩm thực',
    rating: 4.2,
    reviewsCount: '900+',
    duration: '1.5 - 2 giờ',
    difficulty: 'Dễ',
    introduction: 'Quán đồ nướng ngói đá sầm uất thích hợp cho nhóm bạn nhâm nhi ly bia trong thời tiết sương mù se lạnh Đà Lạt.',
    address: '3 Phạm Ngũ Lão, Phường 3, Đà Lạt',
    openHours: '17:00 - 23:30',
    ticketPrice: '80.000 - 150.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    coordinates: { lat: 11.9372, lng: 108.4351 }
  },
  {
    name: 'Bánh tráng nướng Dì Đinh',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '800+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Địa điểm ăn vặt bánh tráng nướng (pizza Đà Lạt) đông khách nhất với đủ loại nhân phô mai bò khô, trứng muối xúc xích.',
    address: '26 Hoàng Diệu, Phường 5, Đà Lạt',
    openHours: '14:00 - 20:30',
    ticketPrice: '15.000 - 30.000 VNĐ / chiếc',
    imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800',
    coordinates: { lat: 11.9429, lng: 108.4309 }
  },
  {
    name: 'Sữa đậu nành Tăng Bạt Hổ Hoa Sữa',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '1.2k+',
    duration: '30 - 45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán sữa vỉa hè nổi danh với ly sữa đậu nành, sữa bò hay sữa bắp nóng hổi ăn kèm bánh ngọt sừng trâu.',
    address: '64 Tăng Bạt Hổ, Phường 1, Đà Lạt',
    openHours: '16:00 - 23:55',
    ticketPrice: '10.000 - 20.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    coordinates: { lat: 11.9431, lng: 108.4358 }
  },

  // Phú Quốc
  {
    name: 'Bún quậy Kiến Xây',
    category: 'Ẩm thực',
    rating: 4.6,
    reviewsCount: '1.8k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Đặc sản bún quậy trứ danh Phú Quốc với mực, chả tôm, chả cá tươi ngọt quết nóng hổi.',
    address: '28 Bạch Đằng, Dương Đông, Phú Quốc',
    openHours: '06:30 - 23:55',
    ticketPrice: '40.000 - 80.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    coordinates: { lat: 10.2178, lng: 103.9592 }
  },
  {
    name: 'Hải sản Xin Chào',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.5k+',
    duration: '1 - 2 giờ',
    difficulty: 'Dễ',
    introduction: 'Nhà hàng hải sản view ngắm hoàng hôn tuyệt đẹp ngay bên bờ biển Dương Đông Phú Quốc.',
    address: '66 Trần Hưng Đạo, Dương Đông, Phú Quốc',
    openHours: '11:00 - 22:00',
    ticketPrice: '100.000 - 400.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    coordinates: { lat: 10.2104, lng: 103.9612 }
  },
  {
    name: 'Bún kèn Út Lượm',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '800+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Món ăn sáng dân dã Phú Quốc với bún, đu đủ bào, cốt dừa béo ngậy và thịt cá xay xào thơm lừng đặc trưng.',
    address: '87 Đường 30 Tháng 4, Dương Đông, Phú Quốc',
    openHours: '06:00 - 11:00',
    ticketPrice: '25.000 - 40.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 10.2154, lng: 103.9631 }
  },
  {
    name: 'Nhà hàng hải sản Sông Xanh',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '500+',
    duration: '1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Nhà hàng rộng rãi mát mẻ ven sông Dương Đông chuyên phục vụ gỏi cá trích, cơm ghẹ và các món lẩu hải sản cực ngon.',
    address: 'Đường 30 Tháng 4, Dương Đông, Phú Quốc',
    openHours: '09:00 - 22:00',
    ticketPrice: '150.000 - 350.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    coordinates: { lat: 10.2148, lng: 103.9665 }
  },
  {
    name: 'Quán hải sản Ra Khơi',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '1.2k+',
    duration: '1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Quán nhậu hải sản cực kỳ đông đúc ở trung tâm Dương Đông, hải sản giá niêm yết rõ ràng chế biến đậm đà hấp dẫn.',
    address: '131 Đường 30 Tháng 4, Dương Đông, Phú Quốc',
    openHours: '10:00 - 23:00',
    ticketPrice: '80.000 - 250.000 VNĐ / món',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    coordinates: { lat: 10.2139, lng: 103.9649 }
  },
  {
    name: 'Chuồn Chuồn Bistro & Skybar',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '2k+',
    duration: '1.5 - 2 giờ',
    difficulty: 'Dễ',
    introduction: 'Địa điểm cafe bistro trên đỉnh đồi có tầm nhìn bao quát toàn bộ thị trấn Dương Đông và biển khơi lúc hoàng hôn rực rỡ.',
    address: 'Đồi Sao Mai, Trần Hưng Đạo, Dương Đông, Phú Quốc',
    openHours: '07:30 - 22:30',
    ticketPrice: '60.000 - 150.000 VNĐ / món',
    imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800',
    coordinates: { lat: 10.2078, lng: 103.9628 }
  },
  {
    name: 'Quán ăn Út Hà Phú Quốc',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '600+',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Quán hải sản bình dân của người dân xứ đảo, mực trứng hấp tỏi, ghẹ Hàm Ninh luộc chấm muối tiêu chanh tươi rói.',
    address: 'Đường Trần Hưng Đạo, Dương Đông, Phú Quốc',
    openHours: '11:00 - 22:00',
    ticketPrice: '50.000 - 180.000 VNĐ / món',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    coordinates: { lat: 10.2054, lng: 103.9619 }
  },
  {
    name: 'Cơm niêu Vy Vy Phú Quốc',
    category: 'Ẩm thực',
    rating: 4.2,
    reviewsCount: '400+',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Đậm đà bữa cơm gia đình Việt với cơm niêu đập, cá bớp kho tộ, canh chua cá bớp ngọt mát và rau luộc chấm kho quẹt.',
    address: 'Đường Nguyễn Trung Trực, Dương Đông, Phú Quốc',
    openHours: '09:00 - 21:30',
    ticketPrice: '60.000 - 120.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    coordinates: { lat: 10.2225, lng: 103.9602 }
  },

  // Nha Trang
  {
    name: 'Bánh canh chả cá cô Hà',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '900+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Bát bánh canh bột lọc dai dẻo nước súp hầm từ xương cá cờ ngọt lịm cùng chả cá hấp dẻo mịn thơm lừng.',
    address: '14 Phan Chu Trinh, Xương Huân, Nha Trang',
    openHours: '07:00 - 21:00',
    ticketPrice: '25.000 - 40.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    coordinates: { lat: 12.2541, lng: 109.1912 }
  },
  {
    name: 'Bún cá sứa Năm Beo',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '1k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán bún cá nổi tiếng gần chợ Đầm, sứa biển trắng giòn sần sật ăn cùng nước lèo trong thanh ngọt vị cá dầm.',
    address: 'B2 Chung cư Chợ Đầm, Nha Trang',
    openHours: '06:00 - 21:00',
    ticketPrice: '30.000 - 55.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 12.2562, lng: 109.1932 }
  },
  {
    name: 'Nem nướng Đặng Văn Quyên',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.8k+',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Quán nem nướng Ninh Hòa nổi tiếng tại trung tâm phố biển, xiên nem xèo xèo nướng lửa than, cuốn bánh tráng rau sống.',
    address: '16A Lãn Ông, Xương Huân, Nha Trang',
    openHours: '07:30 - 22:00',
    ticketPrice: '45.000 - 65.000 VNĐ / suất',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    coordinates: { lat: 12.2539, lng: 109.1925 }
  },
  {
    name: 'Hải sản Thanh Sương',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '2.5k+',
    duration: '1.5 - 2 giờ',
    difficulty: 'Dễ',
    introduction: 'Quán hải sản bình dân ngon rẻ trứ danh Nha Trang, ốc nướng, mực hấp gừng, ghẹ rang muối ớt lúc nào cũng nóng sốt.',
    address: '21 Trần Phú, Vĩnh Nguyên, Nha Trang',
    openHours: '11:00 - 23:00',
    ticketPrice: '100.000 - 250.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    coordinates: { lat: 12.2152, lng: 109.2081 }
  },
  {
    name: 'Bò nướng Lạc Cảnh',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '1.4k+',
    duration: '1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Quán ăn lâu đời với công thức ướp thịt bò nướng mật ong gia truyền nướng lò than ngay tại bàn khói bay thơm phức.',
    address: '44 Nguyễn Bỉnh Khiêm, Xương Huân, Nha Trang',
    openHours: '10:00 - 22:00',
    ticketPrice: '90.000 - 150.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    coordinates: { lat: 12.2548, lng: 109.1955 }
  },
  {
    name: 'Bánh căn Cô Tư tháp Bà',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '800+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Bánh căn nóng hổi nhân tôm thịt hay mực sữa ngọt thanh, chấm ngập trong nước mắm cá kho cay nồng ấm bụng.',
    address: '7A Tháp Bà, Vĩnh Thọ, Nha Trang',
    openHours: '10:00 - 21:00',
    ticketPrice: '30.000 - 50.000 VNĐ / dĩa',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    coordinates: { lat: 12.2685, lng: 109.1942 }
  },
  {
    name: 'Cơm gà Trâm Anh',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '1.2k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Đĩa cơm hạt vàng ươm nấu nước dùng gà, phủ thịt gà xé, lòng non và sốt bơ trứng đặc trưng thơm ngậy khó quên.',
    address: '10 Bà Triệu, Phương Sài, Nha Trang',
    openHours: '09:00 - 20:30',
    ticketPrice: '40.000 - 65.000 VNĐ / suất',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
    coordinates: { lat: 12.2498, lng: 109.1885 }
  },

  // Hội An
  {
    name: 'Cơm gà Bà Buội',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '2k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán cơm gà lâu đời nhất phố cổ Hội An với hạt cơm dẻo vàng, thịt gà ta dai ngọt trộn hành tây chua ngọt.',
    address: '22 Phan Chu Trinh, Minh An, Hội An',
    openHours: '09:00 - 21:30',
    ticketPrice: '35.000 - 55.000 VNĐ / đĩa',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    coordinates: { lat: 15.8778, lng: 108.3289 }
  },
  {
    name: 'Bánh mì Phượng',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '4k+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Bánh mì nổi tiếng thế giới nhờ vỏ giòn tan, pate bơ béo ngậy độc quyền và nước sốt rim thịt đậm đà.',
    address: '2B Phan Chu Trinh, Cẩm Châu, Hội An',
    openHours: '06:30 - 21:30',
    ticketPrice: '25.000 - 35.000 VNĐ / ổ',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
    coordinates: { lat: 15.8782, lng: 108.3308 }
  },
  {
    name: 'Bánh mì Madam Khánh',
    category: 'Ẩm thực',
    rating: 4.6,
    reviewsCount: '2.2k+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Được tôn vinh là "Bánh mì Nữ hoàng" với nhân xá xíu thơm mềm và nước sốt cay cay gia truyền.',
    address: '115 Trần Cao Vân, Minh An, Hội An',
    openHours: '07:00 - 19:30',
    ticketPrice: '25.000 - 35.000 VNĐ / ổ',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    coordinates: { lat: 15.8798, lng: 108.3292 }
  },
  {
    name: 'Cao lầu Thanh',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '800+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán ăn bình dân nhưng sở hữu tô Cao lầu chuẩn vị gỗ tro ngâm gạo, thịt xá xíu thái mỏng da heo chiên giòn tan.',
    address: '26 Thái Phiên, Minh An, Hội An',
    openHours: '06:00 - 15:00',
    ticketPrice: '30.000 - 45.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 15.8812, lng: 108.3274 }
  },
  {
    name: 'Giếng Bá Lễ Hội An',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '1k+',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Thưởng thức bữa nem lụi cuốn bánh tráng nướng than hồng thơm điếc mũi ăn cùng bánh xèo miền Trung giòn rụm.',
    address: '48 Trần Hưng Đạo, Minh An, Hội An',
    openHours: '08:00 - 22:00',
    ticketPrice: '80.000 - 120.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    coordinates: { lat: 15.8791, lng: 108.3298 }
  },
  {
    name: 'Cao lầu Liên',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '700+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Hương vị cao lầu lâu đời hơn 30 năm ở Hội An, sợi mì dai sực thấm đều nước sốt xá xíu thơm béo ngậy.',
    address: '16 Thái Phiên, Minh An, Hội An',
    openHours: '13:00 - 19:30',
    ticketPrice: '30.000 - 40.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    coordinates: { lat: 15.8814, lng: 108.3278 }
  },
  {
    name: 'Mì Quảng Ông Hai',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '500+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Bát mì Quảng sền sệt tôm thịt trứng cút ăn kèm bánh tráng mè nướng giòn rụm bẻ nhỏ trộn đều hấp dẫn.',
    address: '6A Trương Minh Lượng, Cẩm Châu, Hội An',
    openHours: '06:00 - 22:00',
    ticketPrice: '30.000 - 45.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 15.8825, lng: 108.3341 }
  },

  // Sa Pa
  {
    name: 'Thắng cố A Quỳnh Sapa',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.2k+',
    duration: '1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Món lẩu thắng cố thịt ngựa đặc sản Tây Bắc hầm cùng thảo quả quế hồi nóng hổi bốc khói nghi ngút giữa Sapa lạnh giá.',
    address: '15 Thạch Sơn, Sa Pa, Lào Cai',
    openHours: '09:00 - 23:00',
    ticketPrice: '150.000 - 300.000 VNĐ / nồi',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 22.3364, lng: 103.8432 }
  },
  {
    name: 'Lẩu cá hồi vua Sa Pa',
    category: 'Ẩm thực',
    rating: 4.6,
    reviewsCount: '1k+',
    duration: '1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Thịt cá hồi Sapa đỏ ươm tươi rói phi lê mỏng thả lẩu canh chua măng rừng ăn cùng rau cải mèo giòn đắng.',
    address: '15 Lê Văn Tám, Sa Pa, Lào Cai',
    openHours: '10:00 - 22:00',
    ticketPrice: '200.000 - 400.000 VNĐ / nồi',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    coordinates: { lat: 22.3331, lng: 103.8421 }
  },
  {
    name: 'Đồ nướng Sapa phố Cầu Mây',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '800+',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Trải nghiệm chọn các xiên cải mèo cuộn thịt bò, ba chỉ lợn bản nướng than hồng thơm ngọt ăn kèm cơm lam nướng ống tre.',
    address: 'Phố Cầu Mây, Sa Pa, Lào Cai',
    openHours: '16:00 - 23:30',
    ticketPrice: '50.000 - 150.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    coordinates: { lat: 22.3325, lng: 103.8415 }
  },
  {
    name: 'Gà nướng tiêu xanh A Phủ',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.1k+',
    duration: '1 - 1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Món gà đồi nướng đất sét thơm phức quyện sốt tiêu rừng tây bắc cay nồng ăn cùng canh cá tầm thanh ngọt.',
    address: '15 Fansipan, Sa Pa, Lào Cai',
    openHours: '09:00 - 23:00',
    ticketPrice: '100.000 - 250.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    coordinates: { lat: 22.3341, lng: 103.8398 }
  },
  {
    name: 'Nhà hàng Hải Lâm Sapa',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '900+',
    duration: '1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Nơi có đặc sản gà nướng ống tre ngọt thịt và các món cá suối nướng giòn rụm chấm muối ớt xanh.',
    address: '72 Lương Đình Của, Sa Pa, Lào Cai',
    openHours: '09:00 - 22:30',
    ticketPrice: '80.000 - 200.000 VNĐ / món',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
    coordinates: { lat: 22.3402, lng: 103.8451 }
  },
  {
    name: 'Lẩu rau Viet Deli Sapa',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.3k+',
    duration: '1.5 giờ',
    difficulty: 'Dễ',
    introduction: 'Bữa tiệc lẩu rau nấm tươi rừng tây bắc, thịt ba chỉ bò và hải sản tươi rói phục vụ trong không gian ấm cúng hiện đại.',
    address: '01 Lê Văn Tám, Sa Pa, Lào Cai',
    openHours: '10:00 - 22:30',
    ticketPrice: '150.000 - 300.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 22.3333, lng: 103.8423 }
  },

  // Huế
  {
    name: 'Bún bò Huế Mụ Rớt',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.2k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Địa điểm bún bò lâu đời nổi danh bậc nhất cố đô với khoanh giò heo ninh nhừ, tiết bò mọng nước nước lèo đậm đà sả ớt.',
    address: 'Chi Lăng, TP. Huế, Thừa Thiên Huế',
    openHours: '06:00 - 11:00',
    ticketPrice: '40.000 - 60.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    coordinates: { lat: 16.4789, lng: 107.5954 }
  },
  {
    name: 'Cơm hến Hoa Đông',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '900+',
    duration: '30 - 45 phút',
    difficulty: 'Dễ',
    introduction: 'Tô cơm hến cồn Hến ngọt đậm đà xào hành khô ăn kèm rau bắp cải bào nhuyễn, tóp mỡ da heo béo và thìa ớt chưng cay xé lưỡi.',
    address: '64 kiệt 7 Ưng Bình, Vỹ Dạ, TP. Huế, Thừa Thiên Huế',
    openHours: '07:00 - 22:00',
    ticketPrice: '15.000 - 25.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    coordinates: { lat: 16.4712, lng: 107.6152 }
  },
  {
    name: 'Bánh bèo nậm lọc Bà Đỏ',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.6k+',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Mẹt bánh huế truyền thống gồm bánh bèo chén tôm cháy dăm, bánh nậm lá dong nhân thịt mộc nhĩ và bánh bột lọc tôm đất dai dòn.',
    address: '8 Nguyễn Bỉnh Khiêm, TP. Huế, Thừa Thiên Huế',
    openHours: '08:00 - 21:30',
    ticketPrice: '40.000 - 70.000 VNĐ / người',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    coordinates: { lat: 16.4754, lng: 107.5912 }
  },
  {
    name: 'Bún thịt nướng Huyền Anh',
    category: 'Ẩm thực',
    rating: 4.6,
    reviewsCount: '1.4k+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Quán bún thịt nướng Kim Long trứ danh với nước chấm lèo đậu phộng mè xay sánh mịn đặc quánh thay vì nước mắm chua ngọt.',
    address: '52/11 Kim Long, TP. Huế, Thừa Thiên Huế',
    openHours: '09:00 - 21:00',
    ticketPrice: '25.000 - 40.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    coordinates: { lat: 16.4608, lng: 107.5612 }
  },
  {
    name: 'Chè Hẻm Hùng Vương Huế',
    category: 'Ẩm thực',
    rating: 4.5,
    reviewsCount: '1.1k+',
    duration: '30 phút',
    difficulty: 'Dễ',
    introduction: 'Góc hẻm chè Huế trứ danh phục vụ hàng chục loại chè chuối ngự, chè hạt sen nhãn lồng và độc đáo nhất chè bột lọc bọc heo quay.',
    address: '1 kiệt 29 Hùng Vương, TP. Huế, Thừa Thiên Huế',
    openHours: '08:00 - 22:00',
    ticketPrice: '15.000 - 25.000 VNĐ / ly',
    imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800',
    coordinates: { lat: 16.4682, lng: 107.5914 }
  },
  {
    name: 'Bánh khoái Hồng Mai',
    category: 'Ẩm thực',
    rating: 4.3,
    reviewsCount: '800+',
    duration: '1 giờ',
    difficulty: 'Dễ',
    introduction: 'Bánh khoái đúc chảo sâu giòn rụm với nhân trứng tôm thịt bò đầy đặn ăn kèm vả trộn và nước chấm lèo gan heo đặc trưng của Huế.',
    address: '110 Đinh Tiên Hoàng, TP. Huế, Thừa Thiên Huế',
    openHours: '08:00 - 22:00',
    ticketPrice: '30.000 - 55.000 VNĐ / cái',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    coordinates: { lat: 16.4715, lng: 107.5812 }
  },
  {
    name: 'Bún bò Huế O Cương Chú Điệp',
    category: 'Ẩm thực',
    rating: 4.4,
    reviewsCount: '700+',
    duration: '45 phút',
    difficulty: 'Dễ',
    introduction: 'Địa chỉ bún bò ăn sáng quen thuộc của người Huế cổ, nước lèo không dùng mì chính mà ngọt dịu tự nhiên từ xương bò hầm.',
    address: '6 Trần Thúc Nhẫn, TP. Huế, Thừa Thiên Huế',
    openHours: '06:30 - 11:30',
    ticketPrice: '35.000 - 50.000 VNĐ / tô',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    coordinates: { lat: 16.4631, lng: 107.5854 }
  }
];

const seedPopularRestaurants = async () => {
  try {
    const count = await Place.countDocuments({ category: 'Ẩm thực' });
    if (count >= 70) {
      console.log('Seeding skipped: Popular restaurants already exist.');
      return;
    }

    console.log('Seeding popular restaurants to MongoDB places collection...');
    for (const rest of RESTAURANT_SEEDS) {
      await Place.updateOne(
        { name: rest.name },
        { $set: rest },
        { upsert: true }
      );
    }
    console.log(`Successfully seeded ${RESTAURANT_SEEDS.length} popular restaurants.`);
  } catch (err) {
    console.error('Error seeding popular restaurants:', err.message);
  }
};

const HOTEL_SEEDS = [
  // Đà Nẵng
  {
    name: 'InterContinental Danang Sun Peninsula Resort',
    category: 'Khách sạn',
    rating: 4.9,
    reviewsCount: '2k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Resort siêu sang nằm biệt lập trên bán đảo Sơn Trà, đẳng cấp 5 sao quốc tế với bãi biển riêng thơ mộng.',
    address: 'Bán đảo Sơn Trà, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '10.000.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 16.1215, lng: 108.2812 }
  },
  {
    name: 'Furama Resort Danang',
    category: 'Khách sạn',
    rating: 4.7,
    reviewsCount: '1.8k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khu nghỉ dưỡng ẩm thực nổi tiếng với vườn nhiệt đới xanh mát và bãi biển riêng cực rộng.',
    address: '105 Võ Nguyên Giáp, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '3.000.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 16.0492, lng: 108.2483 }
  },
  {
    name: 'Pullman Danang Beach Resort',
    category: 'Khách sạn',
    rating: 4.8,
    reviewsCount: '1.2k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Dịch vụ 5 sao đẳng cấp, hồ bơi lớn sát bãi cát trắng mịn, thích hợp cho cả cặp đôi và gia đình.',
    address: '101 Võ Nguyên Giáp, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '2.800.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 16.0415, lng: 108.2492 }
  },
  {
    name: 'Haian Beach Hotel & Spa',
    category: 'Khách sạn',
    rating: 4.6,
    reviewsCount: '1.5k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn 4 sao sát biển Mỹ Khê, hồ bơi vô cực ngắm trọn cảnh biển Đà Nẵng rực rỡ.',
    address: '278 Võ Nguyên Giáp, Mỹ An, Ngũ Hành Sơn, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.200.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 16.0692, lng: 108.2465 }
  },
  {
    name: 'Sala Danang Beach Hotel',
    category: 'Khách sạn',
    rating: 4.5,
    reviewsCount: '900+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Gần biển Mỹ Khê, thiết kế hiện đại với hồ bơi vô cực trên tầng thượng ngắm bình minh tuyệt đẹp.',
    address: '36 Lâm Hoành, Phước Mỹ, Sơn Trà, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.100.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 16.0712, lng: 108.2472 }
  },
  {
    name: 'Cicilia Hotels & Spa',
    category: 'Khách sạn',
    rating: 4.4,
    reviewsCount: '800+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Nổi bật với phong cách spa trị liệu kết hợp nghỉ dưỡng, phòng ốc bài trí tinh tế.',
    address: '06 Đỗ Bí, Mỹ An, Ngũ Hành Sơn, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '900.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 16.0521, lng: 108.2442 }
  },
  {
    name: 'Khách sạn Minh Toàn Galaxy',
    category: 'Khách sạn',
    rating: 4.3,
    reviewsCount: '600+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn 3 sao sạch sẽ, dịch vụ tiện nghi đầy đủ, gần trung tâm thành phố và sông Hàn.',
    address: '306 Đường 2/9, Hòa Cường Bắc, Hải Châu, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '500.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 16.0461, lng: 108.2211 }
  },
  {
    name: 'Avora Hotel',
    category: 'Khách sạn',
    rating: 4.4,
    reviewsCount: '700+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Vị trí đắc địa ngay mặt đường Bạch Đằng nhìn ra sông Hàn, phòng ốc hiện đại tinh tế.',
    address: '170 Bạch Đằng, Hải Châu I, Hải Châu, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '550.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 16.0665, lng: 108.2259 }
  },
  {
    name: 'Hadana Boutique Da Nang',
    category: 'Khách sạn',
    rating: 4.2,
    reviewsCount: '500+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Thiết kế boutique ấm cúng, tọa lạc khu vực yên tĩnh gần cầu Sông Hàn thuận tiện đi lại.',
    address: 'Phạm Văn Đồng, An Hải Bắc, Sơn Trà, Đà Nẵng',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '580.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 16.0682, lng: 108.2325 }
  },

  // Hà Nội
  {
    name: 'Sofitel Legend Metropole Hanoi',
    category: 'Khách sạn',
    rating: 4.9,
    reviewsCount: '3k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn lịch sử phong cách Pháp cổ điển huyền thoại, đẳng cấp 5 sao sang trọng hàng đầu thủ đô.',
    address: '15 Ngô Quyền, Hoàn Kiếm, Hà Nội',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '6.500.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 21.0254, lng: 105.8572 }
  },
  {
    name: 'JW Marriott Hotel Hanoi',
    category: 'Khách sạn',
    rating: 4.8,
    reviewsCount: '2.5k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Kiến trúc hình rồng độc đáo, dịch vụ siêu sang chuẩn quốc tế bên cạnh Trung tâm Hội nghị Quốc gia.',
    address: '8 Đỗ Đức Dục, Mễ Trì, Nam Từ Liêm, Hà Nội',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '4.500.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 21.0112, lng: 105.7892 }
  },
  {
    name: 'Lotte Hotel Hanoi',
    category: 'Khách sạn',
    rating: 4.8,
    reviewsCount: '2k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Tòa nhà chọc trời ngắm nhìn toàn cảnh thành phố Hà Nội cực kỳ lộng lẫy vào ban đêm.',
    address: '54 Liễu Giai, Cống Vị, Ba Đình, Hà Nội',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '2.200.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 21.0315, lng: 105.8115 }
  },
  {
    name: 'La Sinfonia Del Rey Hotel & Spa',
    category: 'Khách sạn',
    rating: 4.7,
    reviewsCount: '1k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn boutique sang trọng phong cách Hoàng gia nằm ngay trung tâm Hồ Hoàn Kiếm sầm uất.',
    address: '33 Hàng Dầu, Hoàn Kiếm, Hà Nội',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.600.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 21.0325, lng: 105.8561 }
  },
  {
    name: 'Hanoi Emerald Waters Hotel Valley',
    category: 'Khách sạn',
    rating: 4.5,
    reviewsCount: '800+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Phòng ốc rộng rãi, dịch vụ chu đáo tinh tế nằm cách Hồ Hoàn Kiếm chỉ vài bước chân.',
    address: '85 Lò Sũ, Lý Thái Tổ, Hoàn Kiếm, Hà Nội',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.100.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 21.0312, lng: 105.8552 }
  },
  {
    name: 'Little Hanoi Deluxe Hotel',
    category: 'Khách sạn',
    rating: 4.4,
    reviewsCount: '600+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn nhỏ mang đậm không khí phố cổ ấm cúng với đội ngũ nhân viên thân thiện hiếu khách.',
    address: '1 Yên Thái, Hàng Gai, Hoàn Kiếm, Hà Nội',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '550.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 21.0335, lng: 105.8498 }
  },
  {
    name: 'Hanoi Golden Century Hotel',
    category: 'Khách sạn',
    rating: 4.3,
    reviewsCount: '500+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Nằm trong con ngõ nhỏ yên tĩnh thuộc khu phố cổ cổ kính, sạch sẽ ấm cúng.',
    address: '10 Hàng Hành, Hàng Trống, Hoàn Kiếm, Hà Nội',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '450.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 21.0342, lng: 105.8475 }
  },

  // Hồ Chí Minh / Sài Gòn
  {
    name: 'The Reverie Saigon',
    category: 'Khách sạn',
    rating: 4.9,
    reviewsCount: '1.5k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn hoàng gia siêu sang trọng phong cách Ý tọa lạc đắc địa tại Nguyễn Huệ Quận 1.',
    address: '22-36 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '7.000.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 10.7754, lng: 106.7025 }
  },
  {
    name: 'Caravelle Saigon',
    category: 'Khách sạn',
    rating: 4.8,
    reviewsCount: '2k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn 5 sao mang tính biểu tượng lịch sử nhìn thẳng ra Nhà hát Thành phố cổ kính.',
    address: '19-23 Công Trường Lam Sơn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '3.200.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 10.7761, lng: 106.7032 }
  },
  {
    name: 'Liberty Central Saigon Citypoint',
    category: 'Khách sạn',
    rating: 4.5,
    reviewsCount: '1.2k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Vị trí trung tâm Quận 1 cực kỳ năng động đi kèm hồ bơi vô cực ngắm phố phường mát mẻ.',
    address: '59 Pasteur, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.400.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 10.7765, lng: 106.6998 }
  },
  {
    name: 'Fusion Suites Saigon',
    category: 'Khách sạn',
    rating: 4.6,
    reviewsCount: '900+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Nội thất gỗ phong cách minimalism thư giãn tối đa, bao gồm dịch vụ spa hàng ngày cực chất.',
    address: '3-5 Sương Nguyệt Ánh, Bến Thành, Quận 1, TP. Hồ Chí Minh',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.800.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 10.7758, lng: 106.6892 }
  },
  {
    name: 'Aha Boutique Hotel Saigon',
    category: 'Khách sạn',
    rating: 4.2,
    reviewsCount: '500+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Nằm ngay khu phố đi bộ Bùi Viện sầm uất, thuận tiện cho du khách trải nghiệm cuộc sống đêm.',
    address: '12 Bùi Viện, Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '550.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 10.7685, lng: 106.6931 }
  },
  {
    name: 'Town House 50',
    category: 'Khách sạn',
    rating: 4.1,
    reviewsCount: '400+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Hệ thống homestay phòng dorm và phòng riêng nhỏ gọn, thiết kế tinh tế với giá cả cực hợp lý.',
    address: '50 Bùi Thị Xuân, Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '400.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 10.7719, lng: 106.6954 }
  },

  // Đà Lạt
  {
    name: 'Ana Mandara Villas Dalat Resort & Spa',
    category: 'Khách sạn',
    rating: 4.8,
    reviewsCount: '1.5k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khu biệt thự cổ Pháp ẩn mình dưới rừng thông cô tịch lãng mạn bậc nhất xứ sở sương mù.',
    address: 'Đường Lê Lai, Phường 5, Đà Lạt',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '2.500.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 11.9442, lng: 108.4231 }
  },
  {
    name: 'Swiss-Belresort Tuyen Lam',
    category: 'Khách sạn',
    rating: 4.6,
    reviewsCount: '1.2k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Tựa như một tòa lâu đài châu Âu cổ kính giữa thung lũng thông thơ mộng bên hồ Tuyền Lâm.',
    address: 'Hồ Tuyền Lâm, Phường 3, Đà Lạt',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.800.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 11.8925, lng: 108.4312 }
  },
  {
    name: 'Dalat Palace Heritage Hotel',
    category: 'Khách sạn',
    rating: 4.7,
    reviewsCount: '1.1k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn mang phong cách cổ điển di sản thời Pháp thuộc với khuôn viên rộng hướng ra hồ Xuân Hương.',
    address: '2 Trần Phú, Phường 3, Đà Lạt',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.400.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 11.9372, lng: 108.4385 }
  },
  {
    name: 'TTC Hotel Premium - Dalat',
    category: 'Khách sạn',
    rating: 4.5,
    reviewsCount: '900+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Vị trí đắc địa ngay chợ Đà Lạt sầm uất, thiết kế ấm cúng, dịch vụ thân thiện chuyên nghiệp.',
    address: '4 Nguyễn Thị Minh Khai, Phường 1, Đà Lạt',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '950.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 11.9429, lng: 108.4381 }
  },
  {
    name: 'Khách sạn Tulip Dalat',
    category: 'Khách sạn',
    rating: 4.2,
    reviewsCount: '800+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Vị trí tuyệt vời ngay trung tâm đi bộ, sạch sẽ, giá cả cực kỳ bình dân và tiết kiệm.',
    address: '26-28 Ba Tháng Hai, Phường 1, Đà Lạt',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '450.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 11.9431, lng: 108.4359 }
  },
  {
    name: 'Dalat Green Hills Villa',
    category: 'Khách sạn',
    rating: 4.3,
    reviewsCount: '500+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Biệt thự villa sân vườn xinh xắn, yên tĩnh cho gia đình nghỉ dưỡng trọn vẹn tại Đà Lạt.',
    address: 'Khu biệt thự Đường sắt, Phường 9, Đà Lạt',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '350.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 11.9389, lng: 108.4611 }
  },

  // Phú Quốc
  {
    name: 'Regent Phu Quoc',
    category: 'Khách sạn',
    rating: 4.9,
    reviewsCount: '1k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khu nghỉ dưỡng siêu sang chuẩn 6 sao quốc tế, hồ bơi vô cực ngắm hoàng hôn Bãi Trường siêu đẹp.',
    address: 'Bãi Trường, Dương Tơ, Phú Quốc',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '9.000.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 10.1612, lng: 103.9682 }
  },
  {
    name: 'JW Marriott Phu Quoc Emerald Bay Resort',
    category: 'Khách sạn',
    rating: 4.9,
    reviewsCount: '2k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Thiết kế trường đại học giả tưởng độc bản do KTS Bill Bensley thiết kế bên bãi biển Bãi Khem cát trắng.',
    address: 'Bãi Khem, An Thới, Phú Quốc',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '8.500.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 10.0235, lng: 104.0289 }
  },
  {
    name: 'Pullman Phu Quoc Beach Resort',
    category: 'Khách sạn',
    rating: 4.7,
    reviewsCount: '1.2k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Thiết kế lộng lẫy hiện đại, bãi biển riêng và một trong những hồ bơi ngoài trời lớn nhất Phú Quốc.',
    address: 'Đường Bào, Dương Tơ, Phú Quốc',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.800.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 10.1542, lng: 103.9712 }
  },
  {
    name: 'Novotel Phu Quoc Resort',
    category: 'Khách sạn',
    rating: 4.6,
    reviewsCount: '1.5k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Resort 5 sao có khuôn viên vườn dừa xanh mướt, dịch vụ gia đình tận tình thân thiện.',
    address: 'Đường Bào, Dương Tơ, Phú Quốc',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.500.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 10.1581, lng: 103.9749 }
  },
  {
    name: 'Lahana Resort Phu Quoc',
    category: 'Khách sạn',
    rating: 4.5,
    reviewsCount: '1k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khu resort xanh sinh thái ẩn mình trên đồi hoa lá, mang hơi thở thiên nhiên trong lành yên bình.',
    address: '91/3 Trần Hưng Đạo, Dương Đông, Phú Quốc',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '800.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 10.2115, lng: 103.9632 }
  },
  {
    name: 'Phu Quoc Valley Resort',
    category: 'Khách sạn',
    rating: 4.3,
    reviewsCount: '600+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Các Bungalow nhỏ nhắn ấm cúng giữa khu vườn cây xanh mát, mức giá cực kỳ phù hợp túi tiền.',
    address: 'Cửa Lấp, Dương Tơ, Phú Quốc',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '550.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 10.2085, lng: 103.9654 }
  },

  // Nha Trang
  {
    name: 'Six Senses Ninh Van Bay',
    category: 'Khách sạn',
    rating: 4.9,
    reviewsCount: '1k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khu biệt thự sinh thái bằng gỗ mộc mạc ẩn hiện giữa các tảng đá khổng lồ bên vịnh Ninh Vân biệt lập.',
    address: 'Vịnh Ninh Vân, Ninh Hòa, Khánh Hòa',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '15.000.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 12.3585, lng: 109.2812 }
  },
  {
    name: 'Vinpearl Resort & Spa Nha Trang Bay',
    category: 'Khách sạn',
    rating: 4.7,
    reviewsCount: '2k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Tọa lạc trên đảo Hòn Tre với hồ bơi cực rộng sát biển, đầy đủ trò chơi vui chơi giải trí thú vị.',
    address: 'Đảo Hòn Tre, Vĩnh Nguyên, Nha Trang',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '2.800.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 12.2198, lng: 109.2562 }
  },
  {
    name: 'Sheraton Nha Trang Hotel & Spa',
    category: 'Khách sạn',
    rating: 4.6,
    reviewsCount: '1.5k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn 5 sao thương hiệu quốc tế với tất cả các phòng đều hướng biển ngắm trọn cảnh vịnh.',
    address: '26-28 Trần Phú, Lộc Thọ, Nha Trang',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.800.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 12.2478, lng: 109.1969 }
  },
  {
    name: 'Maple Leaf Alacarte Hotel',
    category: 'Khách sạn',
    rating: 4.3,
    reviewsCount: '800+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Căn hộ khách sạn đầy đủ bếp núc tiện nghi, hồ bơi trên cao ngắm nhìn toàn bộ bãi biển Nha Trang.',
    address: '120/12 Nguyễn Thiện Thuật, Tân Lập, Nha Trang',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '550.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 12.2392, lng: 109.1952 }
  },

  // Hội An
  {
    name: 'Four Seasons Resort The Nam Hai',
    category: 'Khách sạn',
    rating: 4.9,
    reviewsCount: '1.1k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khu nghỉ dưỡng siêu sang mang kiến trúc thuần Việt hòa cùng thiên nhiên cát trắng biển xanh.',
    address: 'Khối Hà My Đông B, Điện Bàn, Quảng Nam',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '18.000.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 15.9142, lng: 108.3542 }
  },
  {
    name: 'La Siesta Hoi An Resort & Spa',
    category: 'Khách sạn',
    rating: 4.8,
    reviewsCount: '1.6k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khu resort xinh đẹp sát bên đồng ruộng và sông Hoài, thiết kế cổ điển pha lẫn hiện đại vô cùng thanh lịch.',
    address: '132 Hùng Vương, Thanh Hà, Hội An',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.500.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 15.8792, lng: 108.3225 }
  },
  {
    name: 'Hoi An Trails Resort & Spa',
    category: 'Khách sạn',
    rating: 4.3,
    reviewsCount: '700+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Sân vườn rợp mát dừa nước và ao sen nở rộ mang đậm không gian làng quê Việt Nam thanh bình.',
    address: '276 Cửa Đại, Cẩm Châu, Hội An',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '580.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 15.8821, lng: 108.3442 }
  },

  // Sa Pa
  {
    name: 'Hotel de la Coupole - MGallery Sapa',
    category: 'Khách sạn',
    rating: 4.8,
    reviewsCount: '2.5k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Tác phẩm nghệ thuật thiết kế kiểu Pháp hòa trộn hoa văn thổ cẩm Tây Bắc rực rỡ ở trung tâm thị trấn Sapa.',
    address: '01 Hoàng Liên, Sa Pa, Lào Cai',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '3.500.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 22.3328, lng: 103.8428 }
  },
  {
    name: 'Topas Ecolodge Sapa',
    category: 'Khách sạn',
    rating: 4.7,
    reviewsCount: '1.5k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Bungalow bằng đá nằm cheo leo trên đỉnh đồi có hồ bơi vô cực nước nóng ngắm thung lũng ruộng bậc thang kỳ vĩ.',
    address: 'Bản Lếch, Thanh Kim, Sa Pa, Lào Cai',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '5.500.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 22.2539, lng: 103.9592 }
  },
  {
    name: 'Sapa Horizon Hotel',
    category: 'Khách sạn',
    rating: 4.6,
    reviewsCount: '1k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn ấm cúng với view nhìn thẳng ra dãy Hoàng Liên Sơn hùng vĩ, dịch vụ chăm sóc khách hàng hàng đầu.',
    address: '18 Phạm Ngọc Thạch, Sa Pa, Lào Cai',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '950.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 22.3349, lng: 103.8419 }
  },

  // Huế
  {
    name: 'Azerai La Residence Hue',
    category: 'Khách sạn',
    rating: 4.8,
    reviewsCount: '1.2k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn mang đậm kiến trúc Art Deco cổ kính thời Pháp thuộc nằm uốn mình bên dòng sông Hương thơ mộng.',
    address: '5 Lê Lợi, Vĩnh Ninh, TP. Huế, Thừa Thiên Huế',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '4.500.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    coordinates: { lat: 16.4589, lng: 107.5794 }
  },
  {
    name: 'Imperial Hotel Hue',
    category: 'Khách sạn',
    rating: 4.5,
    reviewsCount: '1k+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Khách sạn 5 sao mang đậm dấu ấn kiến trúc Cung đình Huế quý phái, vị trí trung tâm vô cùng đắc địa.',
    address: '8 Hùng Vương, Phú Nhuận, TP. Huế, Thừa Thiên Huế',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '1.200.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    coordinates: { lat: 16.4715, lng: 107.5911 }
  },
  {
    name: 'Moonlight Hotel Hue',
    category: 'Khách sạn',
    rating: 4.3,
    reviewsCount: '700+',
    duration: 'Qua đêm',
    difficulty: 'Dễ',
    introduction: 'Phòng ốc sạch sẽ, trang trí hài hòa tinh tế, có quán bar tầng thượng ngắm cầu Tràng Tiền lấp lánh màu sắc.',
    address: '20 Phạm Ngũ Lão, Phú Hội, TP. Huế, Thừa Thiên Huế',
    openHours: 'Mở cửa cả ngày',
    ticketPrice: '550.000 VNĐ / đêm',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    coordinates: { lat: 16.4692, lng: 107.5925 }
  }
];

const seedPopularHotels = async () => {
  try {
    const count = await Place.countDocuments({
      $or: [
        { category: 'Khách sạn' },
        { name: { $regex: /khách sạn|hotel|resort|homestay|nhà nghỉ/i } }
      ]
    });
    if (count >= 50) {
      console.log('Seeding skipped: Popular hotels already exist.');
      return;
    }

    console.log('Seeding popular hotels to MongoDB places collection...');
    for (const hotel of HOTEL_SEEDS) {
      await Place.updateOne(
        { name: hotel.name },
        { $set: hotel },
        { upsert: true }
      );
    }
    console.log(`Successfully seeded ${HOTEL_SEEDS.length} popular hotels.`);
  } catch (err) {
    console.error('Error seeding popular hotels:', err.message);
  }
};

const seedAdminData = async () => {
  try {
    await seedItineraryTemplates();
    await seedItineraryPreviewPlaces();
    await seedPopularRestaurants();
    await seedPopularHotels();

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@travelmate.com' });
    if (adminExists) {
      console.log('Seeding skipped: Admin user already exists in database');
      return;
    }

    console.log('Database empty or missing Admin. Starting seed process...');

    // 1. Create Default Admin Settings
    let settings = await AdminSetting.findOne();
    if (!settings) {
      settings = await AdminSetting.create({
        premiumIndividualPrice: 99000,
        premiumFamilyPrice: 249000,
        isNotificationEnabled: true,
        isDailyReportEnabled: false,
        emailReportRecipient: 'admin@travelmate.com',
        notificationFrequency: 'Ngay lập tức',
      });
      console.log('Default system settings seeded.');
    }

    const getPastDate = (daysAgo) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d;
    };

    // 2. Create Users (Admins, Moderators, Analysts, Users)
    const admin = await User.create({
      name: 'TravelMate Admin',
      email: 'admin@travelmate.com',
      password: 'admin123', // Will be hashed automatically by userSchema pre-save
      role: 'admin',
      package: 'premium',
      status: 'active',
      createdAt: getPastDate(30),
    });

    const moderator = await User.create({
      name: 'Thu Hà',
      email: 'moderator@travelmate.com',
      password: 'admin123',
      role: 'moderator',
      package: 'premium',
      status: 'active',
      createdAt: getPastDate(6), // Week 3
    });

    const analyst = await User.create({
      name: 'Khánh Vinh',
      email: 'analyst@travelmate.com',
      password: 'admin123',
      role: 'analyst',
      package: 'free',
      status: 'active',
      createdAt: getPastDate(25), // Week 1
    });

    const user1 = await User.create({
      name: 'Nguyễn Hoàng',
      email: 'hoang.nguyen@example.com',
      password: 'password123',
      role: 'user',
      package: 'premium',
      status: 'active',
      createdAt: getPastDate(24), // Week 1
    });

    const user2 = await User.create({
      name: 'Minh Tú',
      email: 'tu.minh@example.com',
      password: 'password123',
      role: 'user',
      package: 'free',
      status: 'active',
      createdAt: getPastDate(22), // Week 1
    });

    const user3 = await User.create({
      name: 'Quang Anh',
      email: 'anh.quang@example.com',
      password: 'password123',
      role: 'user',
      package: 'premium',
      status: 'active',
      createdAt: getPastDate(15), // Week 2
    });

    const user4 = await User.create({
      name: 'Linh Yến',
      email: 'linh.yen@example.com',
      password: 'password123',
      role: 'user',
      package: 'free',
      status: 'suspended', // Blocked user
      createdAt: getPastDate(12), // Week 2
    });

    const user5 = await User.create({
      name: 'Mỹ Linh',
      email: 'linh.my@example.com',
      password: 'password123',
      role: 'user',
      package: 'premium',
      status: 'active',
      createdAt: getPastDate(8), // Week 3
    });

    const user6 = await User.create({
      name: 'Thanh Phong',
      email: 'phong.thanh@example.com',
      password: 'password123',
      role: 'user',
      package: 'free',
      status: 'active',
      createdAt: getPastDate(1), // Today / Week 4
    });

    console.log('Sample users seeded successfully.');

    // 3. Create Sample Trips (for stats)
    const tripData = [
      { title: 'Chuyến đi Hà Nội', destination: 'Hà Nội', duration: 3, user: user1._id },
      { title: 'Khám phá Đà Nẵng', destination: 'Đà Nẵng', duration: 4, user: user2._id },
      { title: 'Du lịch Phú Quốc', destination: 'Phú Quốc', duration: 5, user: user3._id },
      { title: 'Khám phá Sapa', destination: 'Sapa', duration: 2, user: user5._id },
    ];
    await Trip.insertMany(tripData);
    console.log('Sample trips seeded.');

    // 4. Create Sample Posts (some pending, some approved, some reported)
    const posts = [
      {
        title: 'Hành trình khám phá Vịnh Hạ Long 2 ngày 1 đêm',
        excerpt: 'Vịnh Hạ Long thực sự là một kỳ quan. Mình chia sẻ chuyến đi tuyệt vời với các địa điểm nổi tiếng...',
        content: 'Vịnh Hạ Long thực sự là một kỳ quan thiên nhiên thế giới. Trong chuyến đi 2 ngày 1 đêm này, mình đã có cơ hội chèo thuyền kayak qua các hang động đá vôi nghìn năm tuổi, thưởng thức hải sản tươi sống trên du thuyền và đón bình minh trên vịnh. Đây chắc chắn là trải nghiệm bạn không nên bỏ lỡ khi ghé thăm Quảng Ninh!',
        category: 'Kinh nghiệm',
        imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600',
        author: user1._id,
        status: 'pending',
        reported: false,
      },
      {
        title: 'Check-in Cầu Vàng sáng sớm vắng vẻ',
        excerpt: 'Kinh nghiệm để có những bức ảnh không dính người tại Cầu Vàng là hãy đi chuyến cáp treo đầu tiên...',
        content: 'Cầu Vàng tại Bà Nà Hills, Đà Nẵng là địa điểm cực kỳ hot. Để chụp ảnh không có người, bạn nên đi chuyến cáp treo sớm nhất lúc 7h sáng. Lúc này sương mù còn giăng nhẹ và nắng vừa lên, tạo nên khung cảnh huyền ảo như chốn bồng lai tiên cảnh.',
        category: 'Địa điểm',
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600',
        author: moderator._id,
        status: 'pending',
        reported: false,
      },
      {
        title: 'Gợi ý lịch trình ngắm hoa anh đào tại Kyoto',
        excerpt: 'Mùa xuân này nếu bạn có ý định đến Nhật Bản thì đây là bản đồ các địa điểm ngắm hoa anh đào đẹp nhất...',
        content: 'Mùa hoa anh đào ở Kyoto là một trong những trải nghiệm lãng mạn nhất thế giới. Lịch trình 3 ngày gợi ý bao gồm Đền Kiyomizu-dera, Con đường Triết gia, và khu phố cổ Gion. Hãy chuẩn bị máy ảnh đầy pin vì mỗi góc phố ở Kyoto mùa này đều đẹp như tranh vẽ.',
        category: 'Lịch trình',
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600',
        author: user3._id,
        status: 'pending',
        reported: false,
      },
      {
        title: 'Food tour 24h càn quét đường phố Bangkok',
        excerpt: 'Thái Lan chưa bao giờ làm mình thất vọng về ẩm thực. Từ Tom Yum cay nồng đến xôi xoài ngọt lịm...',
        content: 'Bangkok là thiên đường ẩm thực đường phố. Trong vòng 24 giờ, mình đã thử Pad Thai ở quán Jay Fai nổi tiếng đạt sao Michelin, thưởng thức súp sườn cay khổng lồ tại chợ đêm Jodd Fairs và tráng miệng bằng món xôi xoài béo ngậy. Chi phí cực kỳ rẻ mà hương vị thì không thể quên.',
        category: 'Ẩm thực',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600',
        author: user5._id,
        status: 'pending',
        reported: false,
      },
      {
        title: 'Du lịch bụi Tây Bắc mùa nước đổ',
        excerpt: 'Những thửa ruộng bậc thang như những tấm gương khổng lồ phản chiếu mây trời...',
        content: 'Tây Bắc tháng 5-6 là mùa nước đổ, nước từ các khe núi chảy vào các thửa ruộng bậc thang lấp lánh như gương. Mình đã đi xe máy qua Mù Cang Chải và Y Tý để bắt trọn những khoảnh khắc người dân hăng say cấy lúa dưới ánh hoàng hôn.',
        category: 'Kinh nghiệm',
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?q=80&w=600',
        author: user6._id,
        status: 'approved',
        reported: true, // Reported post
      },
      {
        title: 'Chia sẻ kinh nghiệm săn vé máy bay giá rẻ đi Châu Âu',
        excerpt: 'Làm thế nào để bay sang Paris với giá chỉ 12 triệu khứ hồi? Hãy cùng xem các mẹo dưới đây...',
        content: 'Để săn vé máy bay giá rẻ đi Châu Âu, bạn nên đặt trước từ 3-6 tháng, thường xuyên xóa cookie trình duyệt hoặc dùng ẩn danh khi tìm vé, và lựa chọn các đợt khuyến mãi lớn của Qatar Airways hoặc Singapore Airlines vào tháng 9 hàng năm.',
        category: 'Mẹo du lịch',
        imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600',
        author: user2._id,
        status: 'approved',
        reported: false,
      }
    ];

    await Post.insertMany(posts);
    console.log('Sample posts with pending and reported status seeded.');
    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedAdminData;
