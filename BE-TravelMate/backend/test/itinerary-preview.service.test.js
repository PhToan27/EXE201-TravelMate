const test = require('node:test');
const assert = require('node:assert/strict');
const { __testables } = require('../src/services/itinerary-preview.service');

const places = [
  {
    name: 'Bãi biển Mỹ Khê',
    category: 'Thiên nhiên',
    address: 'Sơn Trà, Đà Nẵng',
    introduction: 'Bãi biển phù hợp thư giãn và chụp ảnh.',
    ticketPrice: 'Miễn phí',
    rating: 4.7,
    coordinates: { lat: 16.05, lng: 108.24 },
  },
  {
    name: 'Bảo tàng Chăm',
    category: 'Văn hóa',
    address: 'Hải Châu, Đà Nẵng',
    introduction: 'Tìm hiểu văn hóa Chăm Pa.',
    ticketPrice: '60.000 VNĐ / người',
    rating: 4.5,
    coordinates: { lat: 16.06, lng: 108.22 },
  },
  {
    name: 'Mì Quảng địa phương',
    category: 'Ẩm thực',
    address: 'Hải Châu, Đà Nẵng',
    introduction: 'Món ăn địa phương cho bữa trưa.',
    ticketPrice: '40.000 - 60.000 VNĐ / người',
    rating: 4.6,
    coordinates: { lat: 16.07, lng: 108.22 },
  },
  {
    name: 'Chợ Hàn',
    category: 'Mua sắm',
    address: 'Hải Châu, Đà Nẵng',
    introduction: 'Nơi mua đặc sản địa phương.',
    ticketPrice: 'Miễn phí',
    rating: 4.2,
    coordinates: { lat: 16.07, lng: 108.23 },
  },
];

test('parsePrice lấy mức giá thấp nhất và nhận diện miễn phí', () => {
  assert.equal(__testables.parsePrice('40.000 - 60.000 VNĐ / người'), 40000);
  assert.equal(__testables.parsePrice('Miễn phí'), 0);
});

test('khớp điểm đến không phân biệt dấu tiếng Việt', () => {
  assert.equal(__testables.matchesDestination(places[0], 'Da Nang'), true);
  assert.equal(__testables.matchesDestination(places[0], 'Hà Nội'), false);
});

test('tạo lịch trình xem trước theo số người, ngân sách và sở thích', () => {
  const result = __testables.buildPreviewFromPlaces(
    {
      destination: 'Đà Nẵng',
      startDate: '2026-07-10',
      endDate: '2026-07-11',
      people: 3,
      budget: 1800000,
      interests: ['Ăn uống', 'Thiên nhiên', 'Văn hóa'],
    },
    places
  );

  assert.equal(result.isPreview, true);
  assert.equal(result.days.length, 2);
  assert.ok(result.days.every((day) => day.activities.length >= 2 && day.activities.length <= 4));
  assert.ok(result.days.flatMap((day) => day.activities).every((activity) => activity.estimatedCost >= 0));
  assert.ok(result.days.flatMap((day) => day.activities).some((activity) => activity.activityType === 'Ăn uống'));
});

test('báo không có kết quả khi điểm đến chưa có dữ liệu phù hợp', () => {
  assert.throws(
    () =>
      __testables.buildPreviewFromPlaces(
        {
          destination: 'Cần Thơ',
          startDate: '2026-07-10',
          endDate: '2026-07-10',
          people: 2,
          budget: 500000,
          interests: ['Ăn uống'],
        },
        places
      ),
    (error) => error.code === 'NO_MATCHING_PLACES'
  );
});
