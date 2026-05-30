# TravelMate Mobile App

Ứng dụng du lịch thông minh với AI lập kế hoạch chuyến đi.

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

```bash
npx expo start
```

Quét QR code bằng **Expo Go** trên iOS/Android.

## Cấu hình API

Mở `src/utils/constants.js` và cập nhật `API_BASE_URL`:

```js
// Emulator Android
export const API_BASE_URL = 'http://10.0.2.2:5000/api';

// iOS Simulator hoặc thiết bị thật
export const API_BASE_URL = 'http://192.168.x.x:5000/api';

// Localhost (web)
export const API_BASE_URL = 'http://localhost:5000/api';
```

## Tính năng

- 🔐 Đăng ký / Đăng nhập với JWT
- ✈️ Tạo chuyến đi với AI lập lịch trình tự động
- 📅 Xem lịch trình theo ngày (timeline)
- 🏨 Gợi ý khách sạn từ AI
- 🍜 Gợi ý nhà hàng từ AI
- 💰 Phân tích ngân sách với biểu đồ
- 🔗 Chia sẻ chuyến đi qua mã code
- 👤 Quản lý hồ sơ cá nhân

## Tech Stack

- Expo + React Native
- React Navigation 6
- Zustand (state management)
- Axios (HTTP client)
- AsyncStorage (lưu token)
