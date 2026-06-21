const act = (time, location, description, cost, category, transport, durationMinutes) => ({
  time,
  location,
  description,
  cost,
  category,
  transport,
  durationMinutes,
});

const day = (dayNumber, theme, activities) => ({
  day: dayNumber,
  date: '',
  theme,
  activities,
});

const restaurantsByStyle = {
  BEACH: [
    ['Hải sản Bé Mặn', 'Hải sản', 250000, 'Quán hải sản nổi tiếng gần biển Mỹ Khê.'],
    ['Cafe biển Mỹ Khê', 'Cafe', 80000, 'Không gian thoáng, hợp nghỉ ngơi sau khi tắm biển.'],
    ['Hải sản Năm Đảnh', 'Hải sản', 180000, 'Giá mềm, nhiều món hải sản địa phương.'],
  ],
  FOOD: [
    ['Mì Quảng Bà Mua', 'Món Việt', 60000, 'Phù hợp để thử mì Quảng Đà Nẵng.'],
    ['Bánh tráng cuốn thịt heo Trần', 'Đặc sản Đà Nẵng', 120000, 'Món đặc sản dễ ăn cho nhóm bạn.'],
    ['Chợ đêm Sơn Trà', 'Ẩm thực đường phố', 150000, 'Nhiều món ăn vặt và hải sản bình dân.'],
  ],
  CULTURE: [
    ['Cơm niêu Đà Nẵng', 'Món Việt', 120000, 'Bữa ăn truyền thống gần trung tâm.'],
    ['Cafe phố cổ Hội An', 'Cafe', 80000, 'Không gian phù hợp nghỉ chân khi tham quan Hội An.'],
    ['Nhà hàng đặc sản Hội An', 'Đặc sản miền Trung', 160000, 'Thử cao lầu, mì Quảng và món địa phương.'],
  ],
  NATURE: [
    ['Quán ăn Sơn Trà', 'Món Việt', 100000, 'Bữa ăn nhẹ trước hoặc sau cung đường Sơn Trà.'],
    ['Cafe view biển Sơn Trà', 'Cafe', 90000, 'Ngắm biển và nghỉ ngơi trên bán đảo.'],
    ['Hải sản ven biển', 'Hải sản', 220000, 'Ăn tối sau lịch trình ngoài trời.'],
  ],
  CHILL: [
    ['Cafe ven sông Hàn', 'Cafe', 90000, 'Không gian nhẹ nhàng để ngắm thành phố.'],
    ['Nhà hàng ven biển Mỹ Khê', 'Món Việt', 160000, 'Bữa tối chậm rãi gần biển.'],
    ['Quán ăn địa phương Hải Châu', 'Món Việt', 100000, 'Phù hợp lịch trình nhẹ nhàng trong trung tâm.'],
  ],
  FAMILY: [
    ['Nhà hàng gia đình Đà Nẵng', 'Món Việt', 160000, 'Không gian rộng, hợp đi cùng trẻ em.'],
    ['Buffet Bà Nà Hills', 'Buffet', 300000, 'Tiện lợi khi vui chơi cả ngày tại Bà Nà.'],
    ['Hải sản gia đình Mỹ Khê', 'Hải sản', 240000, 'Bữa tối thoải mái gần biển.'],
  ],
  BUDGET: [
    ['Mì Quảng bình dân', 'Món Việt', 40000, 'Bữa sáng tiết kiệm, dễ tìm trong trung tâm.'],
    ['Chợ Cồn', 'Ẩm thực chợ', 70000, 'Nhiều món địa phương giá mềm.'],
    ['Bánh mì Đà Nẵng', 'Ăn nhanh', 30000, 'Phù hợp bữa nhẹ khi di chuyển.'],
  ],
};

const makeTemplate = ({ style, title, hotelArea, hotelPrice, days }) => ({
  destinationKey: `da-nang-${style.toLowerCase()}`,
  travelStyleKey: style,
  aliases: ['da nang', 'da-nang', 'danang', 'đà nẵng', 'da nẵng'],
  title,
  result: {
    hotelRecommendation: {
      name: `Khách sạn ${hotelArea} Đà Nẵng`,
      address: `${hotelArea}, Đà Nẵng`,
      description: 'Vị trí thuận tiện, phù hợp để di chuyển theo lịch trình.',
      estimatedCostPerNight: hotelPrice,
    },
    restaurantRecommendations: restaurantsByStyle[style].map(
      ([name, cuisineType, averagePricePerPerson, description], index) => ({
        name,
        cuisineType,
        averagePricePerPerson,
        rating: 4.3 + index * 0.1,
        address: 'Đà Nẵng',
        description,
      })
    ),
    itinerary: days,
  },
});

const itineraryTemplates = [
  makeTemplate({
    style: 'BEACH',
    title: 'Đà Nẵng - Biển Mỹ Khê và nghỉ dưỡng',
    hotelArea: 'gần biển Mỹ Khê',
    hotelPrice: 700000,
    days: [
      day(1, 'Biển Mỹ Khê và trung tâm', [
        act('08:00', 'Biển Mỹ Khê', 'Tắm biển, dạo cát và chụp ảnh buổi sáng.', 0, 'REST', 'GRAB', 150),
        act('11:30', 'Hải sản Bé Mặn', 'Ăn trưa hải sản gần biển.', 250000, 'FOOD', 'WALKING', 90),
        act('16:00', 'Cầu Rồng', 'Tham quan biểu tượng nổi bật của thành phố.', 0, 'PLACE', 'GRAB', 60),
      ]),
      day(2, 'Bán đảo Sơn Trà', [
        act('08:30', 'Chùa Linh Ứng Sơn Trà', 'Tham quan điểm tâm linh hướng biển.', 0, 'PLACE', 'GRAB', 120),
        act('11:00', 'Bán đảo Sơn Trà', 'Ngắm biển trên cung đường núi.', 0, 'PLACE', 'MOTORBIKE', 150),
        act('17:00', 'Biển Phạm Văn Đồng', 'Nghỉ ngơi và ngắm hoàng hôn.', 0, 'REST', 'GRAB', 90),
      ]),
      day(3, 'Ngũ Hành Sơn và Hội An', [
        act('08:00', 'Ngũ Hành Sơn', 'Tham quan hang động và núi đá vôi.', 40000, 'PLACE', 'GRAB', 150),
        act('14:00', 'Phố cổ Hội An', 'Dạo phố cổ, uống cà phê và chụp ảnh.', 120000, 'PLACE', 'CAR', 180),
        act('18:30', 'Sông Hoài', 'Ngắm đèn lồng và ăn tối Hội An.', 200000, 'FOOD', 'WALKING', 120),
      ]),
      day(4, 'Bà Nà Hills', [
        act('08:00', 'Bà Nà Hills', 'Đi cáp treo, tham quan làng Pháp.', 950000, 'PLACE', 'CAR', 300),
        act('14:30', 'Cầu Vàng', 'Chụp ảnh tại điểm check-in nổi tiếng.', 0, 'PLACE', 'WALKING', 60),
        act('19:00', 'Cafe ven sông Hàn', 'Nghỉ ngơi và ngắm thành phố buổi tối.', 80000, 'REST', 'GRAB', 90),
      ]),
      day(5, 'Mua quà và thư giãn', [
        act('08:30', 'Chợ Hàn', 'Mua đặc sản và quà địa phương.', 200000, 'SHOPPING', 'GRAB', 120),
        act('13:30', 'Công viên APEC', 'Dạo nhẹ gần trung tâm.', 0, 'REST', 'GRAB', 90),
        act('16:00', 'Biển Mỹ Khê', 'Ngắm hoàng hôn trước khi kết thúc chuyến đi.', 0, 'REST', 'GRAB', 90),
      ]),
    ],
  }),

  makeTemplate({
    style: 'FOOD',
    title: 'Đà Nẵng - Food tour đặc sản',
    hotelArea: 'quận Hải Châu',
    hotelPrice: 550000,
    days: [
      day(1, 'Food tour trung tâm', [
        act('08:00', 'Mì Quảng Bà Mua', 'Ăn sáng với mì Quảng đặc trưng.', 60000, 'FOOD', 'GRAB', 60),
        act('11:30', 'Bánh tráng cuốn thịt heo Trần', 'Thử đặc sản quen thuộc của Đà Nẵng.', 120000, 'FOOD', 'GRAB', 90),
        act('18:00', 'Chợ đêm Sơn Trà', 'Ăn vặt và khám phá không khí buổi tối.', 180000, 'FOOD', 'GRAB', 120),
      ]),
      day(2, 'Hải sản và cafe biển', [
        act('08:00', 'Biển Mỹ Khê', 'Dạo biển nhẹ trước bữa sáng.', 0, 'REST', 'GRAB', 60),
        act('11:30', 'Hải sản Bé Mặn', 'Ăn hải sản gần biển Mỹ Khê.', 250000, 'FOOD', 'GRAB', 120),
        act('15:30', 'Cafe biển Mỹ Khê', 'Nghỉ ngơi và ngắm biển.', 80000, 'REST', 'WALKING', 90),
      ]),
      day(3, 'Ẩm thực Hội An', [
        act('09:00', 'Phố cổ Hội An', 'Dạo phố cổ và chụp ảnh.', 120000, 'PLACE', 'CAR', 150),
        act('12:00', 'Cao lầu Hội An', 'Thử món cao lầu đặc trưng.', 80000, 'FOOD', 'WALKING', 60),
        act('18:00', 'Sông Hoài', 'Ăn tối, ngắm đèn lồng và thả hoa đăng.', 200000, 'FOOD', 'WALKING', 120),
      ]),
      day(4, 'Chợ địa phương', [
        act('08:30', 'Chợ Cồn', 'Ăn sáng và khám phá món địa phương giá mềm.', 80000, 'FOOD', 'GRAB', 120),
        act('11:30', 'Bún chả cá Đà Nẵng', 'Thử món bún chả cá nổi tiếng.', 60000, 'FOOD', 'GRAB', 60),
        act('18:00', 'Hải sản Năm Đảnh', 'Ăn tối hải sản bình dân.', 180000, 'FOOD', 'GRAB', 120),
      ]),
      day(5, 'Cafe và mua đặc sản', [
        act('08:30', 'Cafe ven sông Hàn', 'Uống cà phê, ngắm nhịp sống thành phố.', 80000, 'REST', 'GRAB', 90),
        act('10:30', 'Chợ Hàn', 'Mua mực rim, tré và đặc sản làm quà.', 200000, 'SHOPPING', 'GRAB', 120),
        act('15:00', 'Bánh xèo bà Dưỡng', 'Kết thúc chuyến đi với món bánh xèo.', 90000, 'FOOD', 'GRAB', 90),
      ]),
    ],
  }),

  makeTemplate({
    style: 'CULTURE',
    title: 'Đà Nẵng - Văn hóa, di tích và Hội An',
    hotelArea: 'trung tâm Hải Châu',
    hotelPrice: 600000,
    days: [
      day(1, 'Di sản Chăm và trung tâm', [
        act('08:30', 'Bảo tàng Chăm', 'Tìm hiểu văn hóa Chăm Pa tại Đà Nẵng.', 60000, 'PLACE', 'GRAB', 120),
        act('11:00', 'Cầu Rồng', 'Tham quan biểu tượng hiện đại của thành phố.', 0, 'PLACE', 'GRAB', 60),
        act('15:00', 'Nhà thờ Chính Tòa Đà Nẵng', 'Chụp ảnh và dạo khu trung tâm.', 0, 'PLACE', 'GRAB', 60),
      ]),
      day(2, 'Ngũ Hành Sơn', [
        act('08:00', 'Ngũ Hành Sơn', 'Khám phá chùa, hang động và núi đá vôi.', 40000, 'PLACE', 'GRAB', 180),
        act('11:30', 'Làng đá Non Nước', 'Tìm hiểu nghề điêu khắc đá truyền thống.', 0, 'PLACE', 'WALKING', 90),
        act('16:00', 'Biển Non Nước', 'Nghỉ nhẹ sau lịch trình tham quan.', 0, 'REST', 'GRAB', 90),
      ]),
      day(3, 'Hội An', [
        act('09:00', 'Phố cổ Hội An', 'Dạo phố cổ và tham quan kiến trúc cổ.', 120000, 'PLACE', 'CAR', 180),
        act('13:30', 'Chùa Cầu', 'Tham quan biểu tượng lịch sử của Hội An.', 0, 'PLACE', 'WALKING', 60),
        act('18:30', 'Sông Hoài', 'Ngắm đèn lồng và ăn tối phố cổ.', 200000, 'FOOD', 'WALKING', 120),
      ]),
      day(4, 'Sơn Trà tâm linh', [
        act('08:30', 'Chùa Linh Ứng Sơn Trà', 'Tham quan tượng Phật Bà và ngắm biển.', 0, 'PLACE', 'GRAB', 120),
        act('11:00', 'Bán đảo Sơn Trà', 'Ngắm cảnh và tìm hiểu hệ sinh thái địa phương.', 0, 'PLACE', 'MOTORBIKE', 120),
        act('15:30', 'Bảo tàng Đồng Đình', 'Tham quan không gian văn hóa trên Sơn Trà.', 50000, 'PLACE', 'GRAB', 90),
      ]),
      day(5, 'Chợ và đời sống địa phương', [
        act('08:30', 'Chợ Hàn', 'Quan sát nhịp sống và mua đặc sản.', 150000, 'SHOPPING', 'GRAB', 120),
        act('11:30', 'Cơm niêu Đà Nẵng', 'Ăn trưa với món Việt truyền thống.', 120000, 'FOOD', 'GRAB', 90),
        act('15:00', 'Công viên APEC', 'Dạo khu trung tâm và chụp ảnh.', 0, 'REST', 'GRAB', 90),
      ]),
    ],
  }),

  makeTemplate({
    style: 'NATURE',
    title: 'Đà Nẵng - Thiên nhiên Sơn Trà và núi biển',
    hotelArea: 'gần Sơn Trà',
    hotelPrice: 600000,
    days: [
      day(1, 'Sơn Trà xanh', [
        act('07:30', 'Bán đảo Sơn Trà', 'Đi cung đường núi, ngắm biển từ trên cao.', 0, 'PLACE', 'MOTORBIKE', 180),
        act('10:30', 'Đỉnh Bàn Cờ', 'Chụp ảnh và ngắm toàn cảnh Đà Nẵng.', 0, 'PLACE', 'MOTORBIKE', 90),
        act('16:00', 'Biển Mỹ Khê', 'Thư giãn sau ngày di chuyển ngoài trời.', 0, 'REST', 'GRAB', 120),
      ]),
      day(2, 'Ngũ Hành Sơn và Non Nước', [
        act('08:00', 'Ngũ Hành Sơn', 'Leo bậc thang nhẹ, tham quan hang động.', 40000, 'PLACE', 'GRAB', 180),
        act('11:30', 'Biển Non Nước', 'Nghỉ chân và ngắm biển yên tĩnh.', 0, 'REST', 'GRAB', 120),
        act('16:00', 'Cafe view biển', 'Uống cà phê và ngắm hoàng hôn.', 90000, 'REST', 'GRAB', 90),
      ]),
      day(3, 'Bà Nà Hills', [
        act('08:00', 'Bà Nà Hills', 'Di chuyển lên núi, tận hưởng khí hậu mát mẻ.', 950000, 'PLACE', 'CAR', 300),
        act('14:30', 'Vườn hoa Le Jardin', 'Dạo vườn hoa và chụp ảnh.', 0, 'PLACE', 'WALKING', 90),
        act('19:00', 'Sông Hàn', 'Dạo nhẹ và nghỉ ngơi buổi tối.', 0, 'REST', 'GRAB', 60),
      ]),
      day(4, 'Rừng dừa Bảy Mẫu', [
        act('08:30', 'Rừng dừa Bảy Mẫu', 'Đi thuyền thúng và trải nghiệm vùng sông nước.', 150000, 'PLACE', 'CAR', 180),
        act('12:00', 'Nhà hàng Hội An', 'Ăn trưa với món địa phương.', 160000, 'FOOD', 'WALKING', 90),
        act('15:30', 'Biển An Bàng', 'Thư giãn trên bãi biển gần Hội An.', 0, 'REST', 'CAR', 120),
      ]),
      day(5, 'Ngày nhẹ nhàng', [
        act('08:30', 'Công viên Biển Đông', 'Dạo biển và ngắm chim bồ câu.', 0, 'REST', 'GRAB', 90),
        act('11:00', 'Chợ Hàn', 'Mua quà trước khi rời Đà Nẵng.', 150000, 'SHOPPING', 'GRAB', 120),
        act('15:00', 'Cafe ven sông Hàn', 'Nghỉ ngơi trước khi kết thúc chuyến đi.', 80000, 'REST', 'GRAB', 90),
      ]),
    ],
  }),

  makeTemplate({
    style: 'CHILL',
    title: 'Đà Nẵng - Lịch trình nhẹ nhàng thư giãn',
    hotelArea: 'gần sông Hàn',
    hotelPrice: 650000,
    days: [
      day(1, 'Sông Hàn và cafe', [
        act('09:00', 'Cafe ven sông Hàn', 'Bắt đầu chuyến đi chậm rãi bên sông.', 90000, 'REST', 'GRAB', 90),
        act('11:00', 'Công viên APEC', 'Dạo nhẹ và chụp ảnh.', 0, 'REST', 'WALKING', 60),
        act('16:00', 'Biển Mỹ Khê', 'Ngắm hoàng hôn và nghỉ ngơi.', 0, 'REST', 'GRAB', 120),
      ]),
      day(2, 'Sơn Trà nhẹ nhàng', [
        act('09:00', 'Chùa Linh Ứng Sơn Trà', 'Tham quan nhẹ, ngắm biển từ trên cao.', 0, 'PLACE', 'GRAB', 120),
        act('12:00', 'Nhà hàng ven biển', 'Ăn trưa chậm rãi gần biển.', 160000, 'FOOD', 'GRAB', 90),
        act('15:30', 'Cafe biển Mỹ Khê', 'Đọc sách, nghỉ ngơi và ngắm biển.', 80000, 'REST', 'WALKING', 120),
      ]),
      day(3, 'Hội An buổi chiều', [
        act('10:00', 'Spa Đà Nẵng', 'Thư giãn buổi sáng trước khi đi Hội An.', 300000, 'REST', 'GRAB', 120),
        act('15:00', 'Phố cổ Hội An', 'Dạo phố cổ lúc chiều mát.', 120000, 'PLACE', 'CAR', 180),
        act('18:30', 'Sông Hoài', 'Ngắm đèn lồng và ăn tối nhẹ.', 180000, 'FOOD', 'WALKING', 120),
      ]),
    ],
  }),

  makeTemplate({
    style: 'FAMILY',
    title: 'Đà Nẵng - Gia đình có trẻ em',
    hotelArea: 'gần biển Mỹ Khê',
    hotelPrice: 850000,
    days: [
      day(1, 'Biển và trung tâm dễ đi', [
        act('08:30', 'Biển Mỹ Khê', 'Tắm biển nhẹ, phù hợp gia đình.', 0, 'REST', 'GRAB', 120),
        act('11:30', 'Nhà hàng gia đình Đà Nẵng', 'Ăn trưa trong không gian rộng rãi.', 160000, 'FOOD', 'GRAB', 90),
        act('16:00', 'Cầu Rồng', 'Tham quan biểu tượng thành phố.', 0, 'PLACE', 'GRAB', 60),
      ]),
      day(2, 'Bà Nà Hills', [
        act('08:00', 'Bà Nà Hills', 'Vui chơi và tham quan cả ngày.', 950000, 'PLACE', 'CAR', 300),
        act('12:00', 'Buffet Bà Nà Hills', 'Ăn trưa tiện lợi trong khu du lịch.', 300000, 'FOOD', 'WALKING', 90),
        act('15:00', 'Fantasy Park', 'Khu vui chơi trong nhà cho gia đình.', 0, 'PLACE', 'WALKING', 120),
      ]),
      day(3, 'Hội An nhẹ nhàng', [
        act('09:00', 'Rừng dừa Bảy Mẫu', 'Đi thuyền thúng, trải nghiệm vui cho trẻ em.', 150000, 'PLACE', 'CAR', 150),
        act('14:00', 'Phố cổ Hội An', 'Dạo phố, ăn vặt và chụp ảnh gia đình.', 150000, 'PLACE', 'CAR', 180),
        act('18:30', 'Sông Hoài', 'Ngắm đèn lồng buổi tối.', 100000, 'REST', 'WALKING', 90),
      ]),
    ],
  }),

  makeTemplate({
    style: 'BUDGET',
    title: 'Đà Nẵng - Tiết kiệm chi phí',
    hotelArea: 'trung tâm hoặc gần biển',
    hotelPrice: 350000,
    days: [
      day(1, 'Trung tâm tiết kiệm', [
        act('08:00', 'Mì Quảng bình dân', 'Ăn sáng tiết kiệm với món địa phương.', 40000, 'FOOD', 'GRAB', 45),
        act('09:30', 'Cầu Rồng', 'Tham quan miễn phí biểu tượng thành phố.', 0, 'PLACE', 'WALKING', 60),
        act('16:00', 'Biển Mỹ Khê', 'Tắm biển và nghỉ ngơi miễn phí.', 0, 'REST', 'GRAB', 150),
      ]),
      day(2, 'Ngũ Hành Sơn và chợ', [
        act('08:00', 'Ngũ Hành Sơn', 'Tham quan điểm nổi bật với chi phí thấp.', 40000, 'PLACE', 'GRAB', 150),
        act('12:00', 'Chợ Cồn', 'Ăn trưa nhiều món địa phương giá mềm.', 70000, 'FOOD', 'GRAB', 90),
        act('15:00', 'Chợ Hàn', 'Mua quà và tham quan chợ trung tâm.', 120000, 'SHOPPING', 'GRAB', 90),
      ]),
      day(3, 'Hội An tự túc', [
        act('09:00', 'Phố cổ Hội An', 'Dạo phố cổ tự túc và chụp ảnh.', 120000, 'PLACE', 'BUS', 180),
        act('12:00', 'Bánh mì Hội An', 'Ăn trưa nhanh, tiết kiệm.', 40000, 'FOOD', 'WALKING', 45),
        act('17:30', 'Sông Hoài', 'Ngắm đèn lồng không tốn nhiều chi phí.', 50000, 'REST', 'WALKING', 120),
      ]),
    ],
  }),
];

module.exports = itineraryTemplates;
