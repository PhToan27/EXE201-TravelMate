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

const supportedPlaces = [
  ...places,
  {
    name: 'Cầu Rồng',
    category: 'Chụp ảnh',
    address: 'Hải Châu, Đà Nẵng',
    introduction: 'Điểm ngắm cảnh thành phố về chiều.',
    ticketPrice: 'Miễn phí',
    rating: 4.5,
    coordinates: { lat: 16.061, lng: 108.227 },
  },
  {
    name: 'Bán đảo Sơn Trà',
    category: 'Thiên nhiên',
    address: 'Sơn Trà, Đà Nẵng',
    introduction: 'Cung đường ven biển với nhiều điểm ngắm cảnh.',
    ticketPrice: 'Miễn phí',
    rating: 4.8,
    coordinates: { lat: 16.121, lng: 108.281 },
  },
  {
    name: 'Chợ đêm Sơn Trà',
    category: 'Ăn uống',
    address: 'Sơn Trà, Đà Nẵng',
    introduction: 'Không gian ăn uống buổi tối nhiều món địa phương.',
    ticketPrice: '50.000 VNĐ / người',
    rating: 4.3,
    coordinates: { lat: 16.077, lng: 108.246 },
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
    supportedPlaces
  );

  assert.equal(result.isPreview, true);
  assert.equal(result.days.length, 2);
  assert.ok(result.days.every((day) => day.activities.length >= 6 && day.activities.length <= 7));
  assert.ok(result.days.every((day) => new Set(day.activities.map((activity) => activity.place)).size === day.activities.length));
  assert.ok(result.days.flatMap((day) => day.activities).every((activity) => activity.estimatedCost >= 0));
  assert.ok(result.days.flatMap((day) => day.activities).some((activity) => activity.activityType === 'Ăn uống'));
});

test('báo thiếu dữ liệu thay vì trả lịch trình dưới 6 điểm mỗi ngày', () => {
  assert.throws(
    () =>
      __testables.buildPreviewFromPlaces(
        {
          destination: 'Đà Nẵng',
          startDate: '2026-07-10',
          endDate: '2026-07-10',
          people: 2,
          budget: 500000,
          interests: ['Ăn uống'],
        },
        places
      ),
    (error) => error.code === 'INSUFFICIENT_PLACES'
  );
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
