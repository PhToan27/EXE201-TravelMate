// API Configuration
// Chọn URL phù hợp với môi trường chạy Expo của bạn:
// 1. Dành cho Android Emulator:
export const API_BASE_URL = 'http://10.0.2.2:5000/api';
// 2. Dành cho iOS Simulator hoặc Web:
// export const API_BASE_URL = 'http://127.0.0.1:5000/api';
// 3. Dành cho điện thoại thật (quét QR code bằng Expo Go):
// Thay IP bên dưới bằng IP LAN/Wifi máy tính của bạn (VD: 192.168.1.X)
// export const API_BASE_URL = 'http://192.168.1.50:5000/api';

// App Theme Colors
export const COLORS = {
  primary: '#F97316',        // Orange accent
  primaryDark: '#EA6C0A',
  primaryLight: '#FED7AA',
  secondary: '#1E293B',      // Dark navy
  background: '#F8FAFC',
  white: '#FFFFFF',
  black: '#0F172A',
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// Typography
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Activity Categories
export const ACTIVITY_CATEGORIES = {
  FOOD: { label: 'Ăn uống', color: '#F59E0B', icon: 'restaurant' },
  PLACE: { label: 'Địa điểm', color: '#3B82F6', icon: 'location' },
  HOTEL: { label: 'Khách sạn', color: '#8B5CF6', icon: 'bed' },
  TRANSPORT: { label: 'Di chuyển', color: '#10B981', icon: 'car' },
  REST: { label: 'Nghỉ ngơi', color: '#6B7280', icon: 'moon' },
  SHOPPING: { label: 'Mua sắm', color: '#EC4899', icon: 'bag' },
  OTHER: { label: 'Khác', color: '#94A3B8', icon: 'ellipsis-horizontal' },
};

// Transport types
export const TRANSPORT_TYPES = {
  WALKING: { label: 'Đi bộ', icon: 'walk' },
  BIKE: { label: 'Xe đạp', icon: 'bicycle' },
  CAR: { label: 'Ô tô', icon: 'car' },
  BUS: { label: 'Xe buýt', icon: 'bus' },
  TAXI: { label: 'Taxi', icon: 'car-sport' },
  GRAB: { label: 'Grab', icon: 'phone-portrait' },
  OTHER: { label: 'Khác', icon: 'ellipsis-horizontal' },
};

// Travel Styles
export const TRAVEL_STYLES = [
  { value: 'CHILL', label: 'Thư giãn' },
  { value: 'ADVENTURE', label: 'Phiêu lưu' },
  { value: 'CULTURE', label: 'Văn hoá' },
  { value: 'LUXURY', label: 'Sang trọng' },
  { value: 'BUDGET', label: 'Tiết kiệm' },
  { value: 'FAMILY', label: 'Gia đình' },
];

// Trip status
export const TRIP_STATUS = {
  DRAFT: { label: 'Nháp', color: '#94A3B8' },
  SAVED: { label: 'Đã lưu', color: '#22C55E' },
  DELETED: { label: 'Đã xóa', color: '#EF4444' },
};

// AsyncStorage Keys
export const STORAGE_KEYS = {
  TOKEN: '@travelmate_token',
  USER: '@travelmate_user',
};
