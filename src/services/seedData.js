const User = require('../models/User');
const Post = require('../models/Post');
const AdminSetting = require('../models/AdminSetting');
const Trip = require('../models/Trip');
const ItineraryTemplate = require('../models/ItineraryTemplate');
const itineraryTemplates = require('../data/itineraryTemplates');

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

const seedAdminData = async () => {
  try {
    await seedItineraryTemplates();

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
