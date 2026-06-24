import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, Backpack, Bell, BookOpen, CalendarDays, Car, ChartNoAxesCombined,
  Check, ChevronDown, CircleUserRound, CloudRain, CloudSun, Compass, FileText, Flag,
  Home, Hotel, ImagePlus, Link2, LocateFixed, LogOut, Map, MapPinned, Menu, MessageCircle,
  Navigation, Pencil, Plane, Plus, Printer, Receipt, RotateCcw, Route, Search, Send,
  ShieldCheck, Sparkles, Sun, ThumbsUp, Trash2, Umbrella, UserPlus, UsersRound, WalletCards,
  X, Zap,
} from 'lucide-react';
import './styles.css';

const safeLocalStorage = {
  getItem(key) {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (e) {
      console.warn('localStorage.getItem error:', e);
      return null;
    }
  },
  setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage.setItem error:', e);
    }
  },
  removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage.removeItem error:', e);
    }
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-panel notice error" style={{ padding: 24, margin: '20px 0', borderRadius: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--error)' }}>⚠️ Đã xảy ra lỗi giao diện</h3>
          <p style={{ fontSize: 13, marginBottom: 12 }}>
            Phần giao diện này gặp lỗi bất thường. Bạn có thể nhấn thử lại hoặc chọn một tab khác trên menu.
          </p>
          <pre style={{ fontSize: 11, background: 'rgba(0,0,0,0.05)', padding: 10, borderRadius: 6, overflowX: 'auto', maxHeight: 120, color: '#333' }}>
            {this.state.error?.toString()}
          </pre>
          <button className="primary" onClick={() => this.setState({ hasError: false, error: null })} style={{ marginTop: 12, padding: '6px 12px', fontSize: 12 }}>
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 24,
          background: '#f8fafc',
          fontFamily: 'Inter, sans-serif',
          color: '#1e293b',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: 500,
            background: 'white',
            padding: 32,
            borderRadius: 16,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: 48,
              marginBottom: 16
            }}>⚠️</div>
            <h1 style={{
              fontSize: 20,
              fontWeight: 800,
              marginBottom: 12,
              color: '#0f172a'
            }}>Đã xảy ra lỗi hệ thống nghiêm trọng</h1>
            <p style={{
              fontSize: 14,
              color: '#64748b',
              marginBottom: 20,
              lineHeight: '1.6'
            }}>
              Ứng dụng TravelMate không thể tải đúng cách. Vui lòng làm mới trang hoặc thử lại sau.
            </p>
            <pre style={{
              fontSize: 12,
              background: '#f1f5f9',
              padding: 12,
              borderRadius: 8,
              overflowX: 'auto',
              maxHeight: 150,
              textAlign: 'left',
              color: '#334155',
              border: '1px solid #e2e8f0',
              marginBottom: 20
            }}>
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                background: '#F97316',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.4)'
              }}
              onMouseOver={(e) => e.target.style.background = '#ea580c'}
              onMouseOut={(e) => e.target.style.background = '#F97316'}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Skeleton({ type = 'text', rows = 3, className = '' }) {
  if (type === 'list') {
    return (
      <div className={`skeleton-list ${className}`} aria-hidden="true" style={{ width: '100%' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div className="skeleton-item" key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, padding: 14, background: 'rgba(255,255,255,0.6)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)' }}>
            <div className="skeleton-pulse" style={{ width: 44, height: 44, borderRadius: 8, background: '#e2e8f0', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="skeleton-pulse" style={{ width: '40%', height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton-pulse" style={{ width: '70%', height: 11, background: '#e2e8f0', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`skeleton-card-grid ${className}`} aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, width: '100%' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div className="skeleton-card" key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.6)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)' }}>
            <div className="skeleton-pulse" style={{ width: '100%', height: 130, background: '#e2e8f0', borderRadius: 8, marginBottom: 12 }} />
            <div className="skeleton-pulse" style={{ width: '60%', height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
            <div className="skeleton-pulse" style={{ width: '80%', height: 11, background: '#e2e8f0', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`skeleton-text ${className}`} aria-hidden="true" style={{ width: '100%', padding: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          className="skeleton-pulse"
          key={i} 
          style={{ 
            width: i === rows - 1 ? '50%' : '100%', 
            height: 12, 
            background: '#e2e8f0', 
            borderRadius: 4, 
            marginBottom: 10 
          }} 
        />
      ))}
    </div>
  );
}

const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://exe201-travelmate-1.onrender.com/api';
const LEGACY_API_BASE_URL = 'https://exe201-travelmate.onrender.com/api';

const getInitialApiBaseUrl = () => {
  const storedUrl = safeLocalStorage.getItem('travelmate.web.apiBaseUrl');
  return storedUrl === LEGACY_API_BASE_URL ? DEFAULT_API_BASE_URL : (storedUrl || DEFAULT_API_BASE_URL);
};

const TAB_PATHS = {
  home: '/',
  places: '/places',
  trips: '/trips',
  tools: '/tools',
  create: '/tools/create-trip',
  preview: '/tools/preview',
  expenses: '/tools/expenses',
  journals: '/tools/journals',
  weather: '/tools/weather',
  shared: '/tools/shared',
  community: '/community',
  profile: '/profile',
  admin: '/admin',
};

const getRouteState = (pathname = window.location.pathname) => {
  const path = pathname.replace(/\/+$/, '') || '/';
  const tripMatch = path.match(/^\/trips\/([^/]+)$/);
  if (tripMatch) return { tab: 'tripDetail', tripId: decodeURIComponent(tripMatch[1]) };

  const tab = Object.entries(TAB_PATHS).find(([, routePath]) => routePath === path)?.[0] || 'home';
  return { tab, tripId: null };
};

const getPathForTab = (tab, options = {}) => {
  if (tab === 'tripDetail' && options.tripId) return `/trips/${encodeURIComponent(options.tripId)}`;
  return TAB_PATHS[tab] || '/';
};

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const money = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v || 0));

const dateText = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v).slice(0, 10) : d.toLocaleDateString('vi-VN');
};

const premiumExpiryText = (value) => value ? dateText(value) : 'chưa có thông tin';

const readStoredJson = (key) => { try { return JSON.parse(safeLocalStorage.getItem(key) || 'null'); } catch { return null; } };

const initialTripForm = {
  destination: 'Đà Nẵng', startDate: today, endDate: tomorrow, people: 2, budget: 3000000,
  travelStyle: 'Biển, Ăn uống', interests: 'biển, hải sản, văn hóa', hotelArea: 'Trung tâm',
  tripType: 'Couple', generateAiItinerary: true,
};

const featuredPlaces = [
  { name: 'Bà Nà Hills', location: 'Hòa Vang, Đà Nẵng', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80' },
  { name: 'Phố Cổ Hội An', location: 'Hội An, Quảng Nam', img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Kinh thành Huế', location: 'Huế, Việt Nam', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80' },
  { name: 'Vịnh Hạ Long', location: 'Quảng Ninh', img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=600&q=80' },
];

const groupByDay = (acts) => acts.reduce((r, a) => { const d = a.day || 1; (r[d] = r[d] || []).push(a); return r; }, {});
const stringify = (v) => { if (v == null) return ''; if (typeof v === 'object') return JSON.stringify(v); return String(v); };
const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};
const toValidCoords = (latValue, lngValue) => {
  const lat = toNumber(latValue);
  const lng = toNumber(lngValue);
  if (lat == null || lng == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};
const coordsFromPair = (pair) => {
  if (!Array.isArray(pair) || pair.length < 2) return null;
  return toValidCoords(pair[1], pair[0]) || toValidCoords(pair[0], pair[1]);
};
const normalizeCoords = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return coordsFromPair(value);
  if (typeof value !== 'object') return null;

  const direct = toValidCoords(value.lat ?? value.latitude, value.lng ?? value.longitude);
  if (direct) return direct;

  if (Array.isArray(value.coordinates)) return coordsFromPair(value.coordinates);
  if (value.coordinates) return normalizeCoords(value.coordinates);
  if (value.location) return normalizeCoords(value.location);
  return null;
};
const getEntityCoords = (...values) => values.map(normalizeCoords).find(Boolean) || null;
const getPlaceLabel = (item) =>
  item?.locationName ||
  (typeof item?.location === 'string' ? item.location : '') ||
  item?.title ||
  item?.name ||
  'Dia diem';

const UiIcon = ({ icon: Icon, size = 18, strokeWidth = 2, className = '' }) => (
  <Icon className={`ui-icon ${className}`} size={size} strokeWidth={strokeWidth} aria-hidden="true" />
);

const WeatherIcon = ({ type, size = 22 }) => {
  const Icon = type === 'sunny-outline' ? Sun : type === 'rainy-outline' ? CloudRain : type === 'thunderstorm-outline' ? Zap : CloudSun;
  return <UiIcon icon={Icon} size={size} />;
};

/* ═══════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════ */
function App() {
  const [apiBaseUrl] = useState(getInitialApiBaseUrl);
  const [token, setToken] = useState(safeLocalStorage.getItem('travelmate.web.token') || '');
  const [user, setUser] = useState(readStoredJson('travelmate.web.user'));
  const [activeTab, setActiveTab] = useState(() => getRouteState().tab);
  const [routeTripId, setRouteTripId] = useState(() => getRouteState().tripId);
  const [routeRenderKey, setRouteRenderKey] = useState(() => `${window.location.pathname}${window.location.search}`);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [preview, setPreview] = useState(null);
  const [places, setPlaces] = useState([]);
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [expenses, setExpenses] = useState(null);
  const [journals, setJournals] = useState([]);
  const [weather, setWeather] = useState(null);
  const [sharedTrip, setSharedTrip] = useState(null);
  const [adminData, setAdminData] = useState(null);

  const api = useMemo(() => async (path, opts = {}) => {
    const body = opts.body;
    const isForm = body instanceof FormData;
    const headers = { ...(opts.headers || {}) };
    if (!isForm && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${apiBaseUrl}${path}`, { method: opts.method || 'GET', body, headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok || data.success === false) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data;
  }, [apiBaseUrl, token]);

  const run = async (task, ok) => {
    setLoading(true); setMessage('');
    try { const r = await task(); if (ok) setMessage(`✅ ${ok}`); return r; }
    catch (e) { setMessage(`❌ ${e.message || 'Có lỗi xảy ra.'}`); return null; }
    finally { setLoading(false); }
  };

  const saveSession = (p) => { setToken(p.token || ''); setUser(p); safeLocalStorage.setItem('travelmate.web.token', p.token || ''); safeLocalStorage.setItem('travelmate.web.user', JSON.stringify(p)); };
  const clearSession = () => { setToken(''); setUser(null); setTrips([]); setSelectedTrip(null); safeLocalStorage.removeItem('travelmate.web.token'); safeLocalStorage.removeItem('travelmate.web.user'); };

  const loadTrips = async () => { if (!token) return; const r = await run(() => api('/trips')); if (r?.data) setTrips(r.data); };
  const applyRouteState = (route = getRouteState()) => {
    setActiveTab(route.tab);
    setRouteTripId(route.tripId);
    setRouteRenderKey(`${window.location.pathname}${window.location.search}`);
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    setNotificationOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };
  const navigateTo = (tab, options = {}) => {
    const path = getPathForTab(tab, options);
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const nextState = { tab, tripId: options.tripId || null };

    if (options.replace) {
      window.history.replaceState(nextState, '', path);
    } else if (currentPath !== path) {
      window.history.pushState(nextState, '', path);
    }

    applyRouteState(nextState);
  };
  const loadTripDetail = async (id, options = {}) => {
    const r = await run(() => api(`/trips/${id}`));
    if (r?.data) {
      setSelectedTrip(r.data);
      navigateTo('tripDetail', { tripId: id, replace: options.replace });
    }
  };
  const loadProfile = async () => { const r = await run(() => api('/auth/profile')); if (r?.data) { const u = { ...user, ...r.data, token }; setUser(u); safeLocalStorage.setItem('travelmate.web.user', JSON.stringify(u)); } };
  const loadNotifications = async () => {
    if (!token) return;
    try {
      const result = await api('/posts/notifications');
      if (result?.data) setNotifications(Array.isArray(result.data) ? result.data : result.data.notifications || []);
    } catch (error) {
      console.warn('Không thể tải thông báo:', error.message);
    }
  };

  useEffect(() => { if (token) { loadTrips(); loadProfile(); loadNotifications(); } }, [token]);
  useEffect(() => {
    const syncFromBrowserRoute = () => {
      applyRouteState(getRouteState());
    };

    window.history.replaceState(getRouteState(), '', `${window.location.pathname}${window.location.search}`);
    window.addEventListener('popstate', syncFromBrowserRoute);
    return () => window.removeEventListener('popstate', syncFromBrowserRoute);
  }, []);
  useEffect(() => {
    const keepExternalLinksOutOfCurrentTab = (event) => {
      const anchor = event.target?.closest?.('a[href]');
      if (!anchor) return;

      if (anchor.getAttribute('target') === '_blank') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      const isExternal = url.origin !== window.location.origin;
      if (!isExternal) return;

      event.preventDefault();
      window.open(url.href, '_blank', 'noopener,noreferrer');
    };

    document.addEventListener('click', keepExternalLinksOutOfCurrentTab, true);
    return () => document.removeEventListener('click', keepExternalLinksOutOfCurrentTab, true);
  }, []);
  useEffect(() => {
    if (token && activeTab === 'tripDetail' && routeTripId && selectedTrip?._id !== routeTripId) {
      loadTripDetail(routeTripId, { replace: true });
    }
  }, [token, activeTab, routeTripId, selectedTrip?._id]);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(''), 4000); return () => clearTimeout(t); } }, [message]);

  if (!token) return <AuthPanel api={api} run={run} saveSession={saveSession} />;

  const firstName = user?.name?.split(' ').pop() || 'bạn';

  const tabTitles = { home: 'Trang chủ', trips: 'Chuyến đi', tools: 'Công cụ', create: 'Tạo chuyến đi', preview: 'Preview AI', places: 'Địa điểm', expenses: 'Chi phí', journals: 'Nhật ký', community: 'Cộng đồng', weather: 'Thời tiết', shared: 'Chia sẻ', profile: 'Hồ sơ', admin: 'Admin', tripDetail: 'Chi tiết chuyến đi' };
  const tabSubtitles = { home: `Xin chào, ${firstName}!`, trips: `${trips.length} chuyến đi`, tools: 'Tạo lịch trình, quản lý chi phí và tra cứu tiện ích', create: 'Lên kế hoạch với AI', preview: 'Xem trước lịch trình', places: 'Tìm kiếm & dẫn đường', expenses: 'Quản lý ngân sách', journals: 'Ghi lại khoảnh khắc', community: 'Chia sẻ trải nghiệm', weather: 'Dự báo điểm đến', shared: 'Mở bằng mã chia sẻ', profile: 'Thông tin cá nhân', admin: 'Quản lý hệ thống', tripDetail: selectedTrip?.destination || '' };

  const go = (tab, options = {}) => navigateTo(tab, options);
  const unreadNotifications = notifications.filter((notification) => !notification.readAt && !notification.isRead).length;

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <header className="main-navbar">
        <div className="navbar-container">
          <div className="navbar-logo" onClick={() => go('home')}>
            <span className="logo-icon"><UiIcon icon={Plane} size={23} /></span>
            <span className="logo-text">TravelMate</span>
          </div>

          <button className="navbar-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Mở menu">
            <UiIcon icon={mobileMenuOpen ? X : Menu} size={22} />
          </button>

          <nav className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <button className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => go('home')}>Trang chủ</button>
            <button className={`nav-link ${activeTab === 'places' ? 'active' : ''}`} onClick={() => go('places')}>Điểm đến</button>
            <button className={`nav-link ${activeTab === 'trips' || activeTab === 'tripDetail' ? 'active' : ''}`} onClick={() => go('trips')}>Chuyến đi</button>
            <button className={`nav-link ${activeTab === 'community' ? 'active' : ''}`} onClick={() => go('community')}>Cộng đồng</button>
            
            <div className={`nav-dropdown ${dropdownOpen ? 'clicked' : ''}`} onMouseLeave={() => setDropdownOpen(false)}>
              <button className={`nav-link dropdown-toggle ${['tools', 'create', 'preview', 'expenses', 'journals', 'weather', 'shared', 'admin'].includes(activeTab) ? 'active' : ''}`} onClick={() => { go('tools'); setDropdownOpen(!dropdownOpen); }} style={{ cursor: 'pointer' }}>Công cụ <UiIcon icon={ChevronDown} size={15} /></button>
              <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                <button onClick={() => { go('create'); setDropdownOpen(false); }}><UiIcon icon={Plane} />Tạo chuyến đi</button>
                <button onClick={() => { go('preview'); setDropdownOpen(false); }}><UiIcon icon={Sparkles} />Preview AI</button>
                <button onClick={() => { go('expenses'); setDropdownOpen(false); }}><UiIcon icon={WalletCards} />Chi phí</button>
                <button onClick={() => { go('journals'); setDropdownOpen(false); }}><UiIcon icon={BookOpen} />Nhật ký</button>
                <button onClick={() => { go('weather'); setDropdownOpen(false); }}><UiIcon icon={CloudSun} />Thời tiết</button>
                <button onClick={() => { go('shared'); setDropdownOpen(false); }}><UiIcon icon={Link2} />Chia sẻ</button>
                {user?.role === 'admin' && <button onClick={() => { go('admin'); setDropdownOpen(false); }}><UiIcon icon={ShieldCheck} />Admin</button>}
              </div>
            </div>
            
            <button className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => go('profile')}>Hồ sơ</button>
          </nav>

          <div className="navbar-user">
            <div className="user-avatar" onClick={() => go('profile')}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
            <div className="user-details" onClick={() => go('profile')}>
              <span className="user-name">{user?.name || user?.email || 'User'}</span>
            </div>
            <div className="notification-wrap">
              <button className="navbar-icon-button" title="Thông báo" aria-label="Thông báo" onClick={() => { setNotificationOpen((open) => !open); loadNotifications(); }}>
                <UiIcon icon={Bell} size={19} />
                {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
              </button>
              {notificationOpen && <div className="notification-popover">
                <div className="notification-popover-title"><span>Thông báo</span><button onClick={() => setNotificationOpen(false)} aria-label="Đóng thông báo"><UiIcon icon={X} size={16} /></button></div>
                {notifications.length === 0 ? <p className="muted">Chưa có thông báo mới.</p> : notifications.slice(0, 6).map((notification) => <div className="notification-item" key={notification._id || notification.id}><UiIcon icon={Bell} size={16} /><div><strong>{notification.type || 'Thông báo'}</strong><p>{notification.message || notification.content}</p></div></div>)}
              </div>}
            </div>
            <button className="logout-btn" onClick={clearSession} title="Đăng xuất" aria-label="Đăng xuất"><UiIcon icon={LogOut} size={19} /></button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {loading && <div className="loading-bar" />}

        {/* Page Body */}
        <div className="page-body" key={routeRenderKey}>
          {message && <div className={`notice ${message.startsWith('✅') ? 'success' : 'error'}`}>{message}</div>}

          <ErrorBoundary>
            {activeTab === 'home' && <HomePanel api={api} run={run} firstName={firstName} go={go} setPreview={setPreview} posts={posts} setPosts={setPosts} trips={trips} loadTripDetail={loadTripDetail} />}
            {activeTab === 'trips' && <TripsPanel trips={trips} loadTrips={loadTrips} loadTripDetail={loadTripDetail} go={go} loading={loading} />}
            {activeTab === 'tools' && <ToolsPanel go={go} user={user} />}
            {activeTab === 'create' && <CreateTripPanel api={api} run={run} onCreated={(t) => { setSelectedTrip(t); loadTrips(); go('tripDetail', { tripId: t._id || t.id }); }} />}
            {activeTab === 'preview' && <PreviewPanel api={api} run={run} preview={preview} setPreview={setPreview} />}
            {activeTab === 'places' && <PlacesPanel api={api} run={run} places={places} setPlaces={setPlaces} loading={loading} />}
            {activeTab === 'expenses' && <ExpensesPanel api={api} run={run} trips={trips} expenses={expenses} setExpenses={setExpenses} loading={loading} />}
            {activeTab === 'journals' && <JournalsPanel api={api} run={run} trips={trips} journals={journals} setJournals={setJournals} user={user} go={go} loading={loading} />}
            {activeTab === 'community' && <CommunityPanel api={api} run={run} posts={posts} setPosts={setPosts} loading={loading} user={user} />}
            {activeTab === 'weather' && <WeatherPanel api={api} run={run} weather={weather} setWeather={setWeather} loading={loading} />}
            {activeTab === 'shared' && <SharedPanel api={api} run={run} sharedTrip={sharedTrip} setSharedTrip={setSharedTrip} />}
            {activeTab === 'profile' && <ProfilePanel api={api} run={run} user={user} setUser={setUser} token={token} loadProfile={loadProfile} clearSession={clearSession} />}
            {activeTab === 'admin' && <AdminPanel api={api} run={run} adminData={adminData} setAdminData={setAdminData} />}
            {activeTab === 'tripDetail' && selectedTrip && <TripDetail api={api} run={run} trip={selectedTrip} setSelectedTrip={setSelectedTrip} loadTripDetail={loadTripDetail} go={go} />}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

function ToolsPanel({ go, user }) {
  const tools = [
    { tab: 'create', title: 'Tạo chuyến đi', desc: 'Lập kế hoạch mới từ điểm đến, ngày đi, ngân sách và sở thích.', icon: Plane },
    { tab: 'preview', title: 'Gợi ý lịch trình', desc: 'Xem trước lịch trình AI trước khi lưu thành chuyến đi.', icon: Sparkles },
    { tab: 'expenses', title: 'Chi phí', desc: 'Theo dõi ngân sách, khoản chi và bill đã nhập.', icon: WalletCards },
    { tab: 'journals', title: 'Nhật ký', desc: 'Lưu ảnh và câu chuyện trong chuyến đi dành cho Premium.', icon: BookOpen },
    { tab: 'weather', title: 'Thời tiết', desc: 'Xem dự báo để chọn hoạt động phù hợp.', icon: CloudSun },
    { tab: 'shared', title: 'Chia sẻ', desc: 'Mở lịch trình được chia sẻ bằng mã hoặc đường dẫn.', icon: Link2 },
  ];
  if (user?.role === 'admin') {
    tools.push({ tab: 'admin', title: 'Admin', desc: 'Quản lý người dùng, bài viết và thiết lập hệ thống.', icon: ShieldCheck });
  }

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <h2>Công cụ TravelMate</h2>
          <p>Chọn nhanh chức năng bạn muốn dùng.</p>
        </div>
      </div>
      <div className="content-grid-3">
        {tools.map((tool) => (
          <button key={tool.tab} type="button" className="card card-pad tool-card" onClick={() => go(tool.tab)}>
            <div className="item-icon"><UiIcon icon={tool.icon} /></div>
            <h3>{tool.title}</h3>
            <p>{tool.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════ */
function AuthPanel({ api, run, saveSession }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const submit = async (e) => {
    e.preventDefault();
    const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
    const r = await run(() => api(mode === 'login' ? '/auth/login' : '/auth/register', { method: 'POST', body: JSON.stringify(payload) }), mode === 'login' ? 'Đăng nhập thành công.' : 'Đăng ký thành công.');
    if (r?.data) saveSession(r.data);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-slider" aria-hidden="true">
        <div className="auth-bg-slide auth-bg-dragon" />
        <div className="auth-bg-slide auth-bg-bana" />
        <div className="auth-bg-slide auth-bg-mykhe" />
      </div>

      <div className="auth-slide-labels" aria-hidden="true">
        <span>Cầu Rồng, Đà Nẵng</span>
        <span>Bà Nà Hills</span>
        <span>Biển Mỹ Khê</span>
      </div>

      <div className="auth-center-shell">
        <div className="auth-form-side">
          <div className="auth-card-brand">
            <div className="auth-hero-logo"><UiIcon icon={Plane} size={30} /></div>
            <div>
              <h1>TravelMate</h1>
              <p>Lịch trình thông minh cho những chuyến đi Đà Nẵng đáng nhớ.</p>
            </div>
          </div>

          <div className="auth-feature-row">
            <span><UiIcon icon={Map} size={15} />AI lịch trình</span>
            <span><UiIcon icon={WalletCards} size={15} />Chi phí</span>
            <span><UiIcon icon={MapPinned} size={15} />Địa điểm</span>
          </div>

          <h2>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Đăng nhập để tiếp tục hành trình khám phá cùng TravelMate' : 'Đăng ký để bắt đầu lập kế hoạch du lịch thông minh'}</p>
          <form className="form-stack" onSubmit={submit}>
            {mode === 'register' && <TextInput label="Họ và tên" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />}
            <TextInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <TextInput label="Mật khẩu" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            <button className="auth-submit-btn" type="submit">
              {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </form>
          <div className="auth-switch-row">
            <span>{mode === 'login' ? 'Bạn chưa có tài khoản?' : 'Đã có tài khoản?'}</span>
            <button className="auth-switch-link" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? ' Đăng ký ngay' : ' Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOME
   ═══════════════════════════════════════════════════════════ */
function HomePanel({ api, run, firstName, go, setPreview, posts, setPosts, trips, loadTripDetail }) {
  const [plan, setPlan] = useState({
    destination: 'Ngũ Hành Sơn', startDate: today, endDate: tomorrow, people: 2,
    budget: 3000000, interests: ['Ăn uống'],
  });

  const createPreview = async (e) => {
    e.preventDefault();
    const r = await run(() => api('/itinerary-preview', {
      method: 'POST',
      body: JSON.stringify(plan),
    }), 'Đã tạo bản xem trước lịch trình.');
    if (r?.data) { setPreview(r.data); go('preview'); }
  };

  const toggleInterest = (interest) => {
    setPlan((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }));
  };

  const loadPosts = async () => {
    const r = await run(() => api('/posts'));
    if (r?.data) setPosts(Array.isArray(r.data) ? r.data : r.data.posts || []);
  };

  useEffect(() => { loadPosts(); }, []);

  const recentTrips = trips.slice(0, 5);

  return (
    <div className="animate-in">
      {/* Premium Web Hero */}
      <div className="web-hero">
        <div className="web-hero-overlay" />
        <div className="web-hero-content">
          <h1>Xin chào, {firstName}</h1>
          <p>Khám phá các địa điểm tuyệt vời, tạo lịch trình AI và quản lý chi phí chuyến đi của bạn</p>
        </div>

        {/* Itinerary preview form */}
        <div className="glass-search-container">
          <form className="glass-search-form home-planner-form" onSubmit={createPreview}>
            <div className="search-field-group planner-destination">
              <span className="search-field-icon"><UiIcon icon={MapPinned} size={19} /></span>
              <div className="search-field-input">
                <span className="search-field-label">Điểm đến</span>
                <input 
                  value={plan.destination}
                  onChange={(e) => setPlan({ ...plan, destination: e.target.value })}
                  placeholder="Ví dụ: Đà Nẵng"
                  required
                />
              </div>
            </div>

            <div className="search-field-group">
              <span className="search-field-icon"><UiIcon icon={CalendarDays} size={19} /></span>
              <div className="search-field-input">
                <span className="search-field-label">Ngày đi</span>
                <input 
                  type="date"
                  value={plan.startDate}
                  onChange={(e) => setPlan({ ...plan, startDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="search-field-group">
              <span className="search-field-icon"><UiIcon icon={CalendarDays} size={19} /></span>
              <div className="search-field-input">
                <span className="search-field-label">Ngày về</span>
                <input 
                  type="date"
                  min={plan.startDate}
                  value={plan.endDate}
                  onChange={(e) => setPlan({ ...plan, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="search-field-group">
              <span className="search-field-icon"><UiIcon icon={UsersRound} size={19} /></span>
              <div className="search-field-input">
                <span className="search-field-label">Số người</span>
                <input
                  type="number"
                  min="1"
                  value={plan.people}
                  onChange={(e) => setPlan({ ...plan, people: Math.max(Number(e.target.value) || 1, 1) })}
                  required
                />
              </div>
            </div>

            <div className="search-field-group">
              <span className="search-field-icon"><UiIcon icon={WalletCards} size={19} /></span>
              <div className="search-field-input">
                <span className="search-field-label">Ngân sách (VND)</span>
                <input
                  type="number"
                  min="0"
                  value={plan.budget}
                  onChange={(e) => setPlan({ ...plan, budget: Number(e.target.value) || 0 })}
                  placeholder="Ví dụ: 3000000"
                  required
                />
              </div>
            </div>

            <div className="planner-interests">
              <span className="planner-field-label">Sở thích</span>
              <div className="planner-chips">
                {interestOptions.map((item) => (
                  <button
                    className={`planner-chip ${plan.interests.includes(item.value) ? 'active' : ''}`}
                    type="button"
                    key={item.value}
                    onClick={() => toggleInterest(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="glass-search-btn planner-submit" type="submit">
              <UiIcon icon={Sparkles} size={19} />Tạo lịch trình gợi ý
            </button>
          </form>
        </div>
      </div>

      {/* Premium Destinations Section - Grid 3 ảnh tương tự screenshot */}
      <div className="premium-places-section">
        <div className="section-header">
          <h2 className="section-title"><UiIcon icon={MapPinned} />Điểm đến nổi bật</h2>
          <button className="see-all-btn icon-text" onClick={() => go('places')}>Xem tất cả <UiIcon icon={ArrowRight} size={16} /></button>
        </div>
        
        <div className="premium-places-grid">
          {/* Cột trái: Card lớn - Trending Destinations */}
          <div className="premium-places-left">
            <div className="premium-card premium-card-large" onClick={() => setPlan({ ...plan, destination: 'Bà Nà Hills' })}>
              <img src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80" alt="Bà Nà Hills" loading="lazy" />
              <div className="premium-card-overlay" />
              <div className="premium-card-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              </div>
              <div className="premium-card-content">
                <h3 className="premium-card-title">Trending Destinations</h3>
                <p className="premium-card-subtitle">Bà Nà Hills, Đà Nẵng - 145 places</p>
              </div>
            </div>
          </div>

          {/* Cột phải: 2 Card xếp chồng */}
          <div className="premium-places-right">
            <div className="premium-card premium-card-small" onClick={() => setPlan({ ...plan, destination: 'Phố Cổ Hội An' })}>
              <img src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1000&q=80" alt="Phố Cổ Hội An" loading="lazy" />
              <div className="premium-card-overlay" />
              <div className="premium-card-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"></path><path d="M11 3 8 9l3 13h2l3-13-3-6z"></path></svg>
              </div>
              <div className="premium-card-content">
                <h3 className="premium-card-title">Hidden Gems</h3>
                <p className="premium-card-subtitle">Phố Cổ Hội An, Quảng Nam - 50 places</p>
              </div>
            </div>

            <div className="premium-card premium-card-small" onClick={() => setPlan({ ...plan, destination: 'Kinh thành Huế' })}>
              <img src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80" alt="Kinh thành Huế" loading="lazy" />
              <div className="premium-card-overlay" />
              <div className="premium-card-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div className="premium-card-content">
                <h3 className="premium-card-title">Kinh thành Huế</h3>
                <p className="premium-card-subtitle">Huế, Việt Nam - 35 places</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column: Recent Trips + Community Posts */}
      <div className="content-grid">
        <div>
          <div className="section-header">
            <h2 className="section-title"><UiIcon icon={Map} />Chuyến đi gần đây</h2>
            <button className="see-all-btn icon-text" onClick={() => go('trips')}>Tất cả <UiIcon icon={ArrowRight} size={16} /></button>
          </div>
          {recentTrips.length === 0 ? (
            <div className="card card-pad">
              <div className="empty-state">
                <div className="empty-state-icon"><UiIcon icon={Plane} size={36} /></div>
                <div className="empty-state-title">Chưa có chuyến đi</div>
                <div className="empty-state-text">Tạo chuyến đi đầu tiên và trải nghiệm lập kế hoạch với AI</div>
                <button className="primary" onClick={() => go('create')}>+ Tạo chuyến đi</button>
              </div>
            </div>
          ) : (
            recentTrips.map((t) => (
              <div className="trip-card" key={t._id} onClick={() => loadTripDetail(t._id)}>
                <div className="trip-card-icon"><UiIcon icon={MapPinned} /></div>
                <div className="trip-card-body">
                  <div className="trip-card-dest">{t.destination}</div>
                  <div className="trip-card-meta">
                    <span><UiIcon icon={CalendarDays} size={15} />{dateText(t.startDate)} - {dateText(t.endDate)}</span>
                    <span><UiIcon icon={UsersRound} size={15} />{t.totalPeople || 1}</span>
                  </div>
                  <div className="trip-card-budget">{money(t.budget)}</div>
                </div>
                <span className="trip-card-arrow">›</span>
              </div>
            ))
          )}
        </div>
        <div>
          <div className="section-header">
            <h2 className="section-title"><UiIcon icon={MessageCircle} />Bài viết cộng đồng</h2>
            <button className="see-all-btn icon-text" onClick={() => go('community')}>Tất cả <UiIcon icon={ArrowRight} size={16} /></button>
          </div>
          <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {posts.slice(0, 4).map((p) => (
              <div className="post-card" key={p._id} style={{ cursor: 'pointer' }} onClick={() => go('community')}>
                <div className="post-card-header">
                  <span className="post-card-icon"><UiIcon icon={FileText} /></span>
                  <span className="post-card-category">{p.category || 'Du lịch'}</span>
                </div>
                <div className="post-card-body">
                  <div className="post-card-title">{p.title}</div>
                  <div className="post-card-meta">{p.author?.name || 'TravelMate'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRIPS
   ═══════════════════════════════════════════════════════════ */
function TripsPanel({ trips, loadTrips, loadTripDetail, go, loading }) {
  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <button className="icon-text" onClick={loadTrips}><UiIcon icon={RotateCcw} />Tải lại</button>
      </div>
      {loading && trips.length === 0 ? (
        <Skeleton type="list" rows={3} />
      ) : trips.length === 0 ? (
        <div className="card card-pad"><div className="empty-state"><div className="empty-state-icon"><UiIcon icon={Map} size={36} /></div><div className="empty-state-title">Chưa có chuyến đi</div><div className="empty-state-text">Hãy tạo chuyến đi đầu tiên!</div></div></div>
      ) : (
        <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
          {trips.map((t) => (
            <div className="trip-card" key={t._id} onClick={() => loadTripDetail(t._id)}>
              <div className="trip-card-icon"><UiIcon icon={MapPinned} /></div>
              <div className="trip-card-body">
                <div className="trip-card-dest">{t.destination}</div>
                <div className="trip-card-meta">
                  <span><UiIcon icon={CalendarDays} size={15} />{dateText(t.startDate)} - {dateText(t.endDate)}</span>
                  <span><UiIcon icon={UsersRound} size={15} />{t.totalPeople || 1} người</span>
                  {t.budgetStats?.remainingBudget != null && <span style={{ color: 'var(--success)' }}>Còn {money(t.budgetStats.remainingBudget)}</span>}
                </div>
                <div className="trip-card-budget">{money(t.budget)}</div>
              </div>
              <span className="trip-card-arrow">›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CREATE TRIP
   ═══════════════════════════════════════════════════════════ */
function CreateTripPanel({ api, run, onCreated }) {
  const [form, setForm] = useState(initialTripForm);
  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => api('/trips', { method: 'POST', body: JSON.stringify(form) }), 'Đã tạo chuyến đi.');
    if (r?.data) onCreated(r.data);
  };
  return (
    <div className="animate-in">
      <div className="card card-pad">
        <TripForm form={form} setForm={setForm} onSubmit={submit} submitText="Tạo chuyến đi" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PREVIEW
   ═══════════════════════════════════════════════════════════ */
function PreviewPanel({ api, run, preview, setPreview }) {
  const [form, setForm] = useState({ destination: 'Đà Nẵng', startDate: today, endDate: tomorrow, people: 2, budget: 3000000, interests: 'Ăn uống, Biển, Văn hóa' });
  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => api('/itinerary-preview', { method: 'POST', body: JSON.stringify({ ...form, interests: form.interests.split(',').map(s => s.trim()).filter(Boolean) }) }), 'Đã tạo preview.');
    if (r?.data) setPreview(r.data);
  };
  return (
    <div className="animate-in">
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <form className="form-grid form-grid-3" onSubmit={submit}>
          <TextInput label="Điểm đến" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} />
          <TextInput label="Ngày đi" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
          <TextInput label="Ngày về" type="date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
          <TextInput label="Số người" type="number" value={form.people} onChange={(v) => setForm({ ...form, people: Number(v) })} />
          <TextInput label="Ngân sách" type="number" value={form.budget} onChange={(v) => setForm({ ...form, budget: Number(v) })} />
          <div className="full">
            <label>Sở thích du lịch</label>
            <div className="chips-container">
              {interestOptions.map(item => {
                const activeInterests = form.interests ? form.interests.split(',').map(s => s.trim()) : [];
                const isActive = activeInterests.includes(item.value);
                const toggle = () => {
                  const next = isActive 
                    ? activeInterests.filter(x => x !== item.value)
                    : [...activeInterests, item.value];
                  setForm({ ...form, interests: next.join(', ') });
                };
                return (
                  <button type="button" key={item.value} className={`chip-btn ${isActive ? 'active' : ''}`} onClick={toggle}>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="full"><button className="primary" type="submit" style={{ width: '100%' }}>✨ Tạo preview lịch trình</button></div>
        </form>
      </div>
      {preview && <div className="card card-pad animate-in"><PreviewResult preview={preview} /></div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRIP DETAIL
   ═══════════════════════════════════════════════════════════ */
function TripDetail({ api, run, trip, setSelectedTrip, loadTripDetail, go }) {
  const [packingInput, setPackingInput] = useState('');
  const [detailTab, setDetailTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [optimizingDay, setOptimizingDay] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);
  const [mapRouteInfo, setMapRouteInfo] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [tripWeather, setTripWeather] = useState(null);

  const detailMapInstanceRef = React.useRef(null);
  const detailStartMarkerRef = React.useRef(null);
  const detailEndMarkerRef = React.useRef(null);
  const detailRouteLineRef = React.useRef(null);

  const days = groupByDay(trip.activities || []);
  const TABS = ['Lịch trình', 'Nơi ở', 'Ăn uống', 'Ngân sách', 'Packing', 'Thời tiết'];

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.warn('TripDetail Geolocation failed:', err.message);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // Weather
  const loadTripWeather = async () => {
    try {
      const r = await api(`/weather?destination=${encodeURIComponent(trip.destination)}&days=5`);
      if (r?.data) setTripWeather(r.data);
    } catch (err) {
      console.error('Failed to load trip weather:', err);
    }
  };

  useEffect(() => {
    if (trip?.destination) {
      loadTripWeather();
    }
  }, [trip?.destination]);

  // Leaflet map initialization
  useEffect(() => {
    if (!window.L) return;
    if (detailMapInstanceRef.current) return;

    const map = window.L.map('trip-detail-map').setView([16.0544, 108.2022], 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    detailMapInstanceRef.current = map;

    return () => {
      if (detailMapInstanceRef.current) {
        detailMapInstanceRef.current.remove();
        detailMapInstanceRef.current = null;
      }
    };
  }, []);

  // Auto set first activity coordinates as map target
  useEffect(() => {
    if (trip && trip.activities && trip.activities.length > 0) {
      const first = trip.activities[0];
      const coords = getEntityCoords(first.coordinates, first.location, first);
      if (coords) {
        setMapTarget({
          name: getPlaceLabel(first),
          lat: coords.lat,
          lng: coords.lng,
          startLat: userCoords?.lat,
          startLng: userCoords?.lng,
          startLabel: 'Vị trí của bạn'
        });
      }
    }
  }, [trip, userCoords]);

  // Redraw route on target change
  useEffect(() => {
    const map = detailMapInstanceRef.current;
    if (!map || !window.L || !mapTarget) return;

    if (detailStartMarkerRef.current) map.removeLayer(detailStartMarkerRef.current);
    if (detailEndMarkerRef.current) map.removeLayer(detailEndMarkerRef.current);
    if (detailRouteLineRef.current) map.removeLayer(detailRouteLineRef.current);

    const { name, lat, lng, startLat, startLng, startLabel } = mapTarget;
    const bounds = [];

    if (startLat && startLng) {
      detailStartMarkerRef.current = window.L.marker([startLat, startLng], {
        title: startLabel,
        icon: window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #3B82F6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        })
      }).addTo(map).bindPopup(startLabel);
      bounds.push([startLat, startLng]);
    }

    detailEndMarkerRef.current = window.L.marker([lat, lng], {
      title: name
    }).addTo(map).bindPopup(name).openPopup();
    bounds.push([lat, lng]);

    if (startLat && startLng) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${lng},${lat}?overview=full&geometries=geojson`);
          if (res.ok) {
            const data = await res.json();
            const geom = data.routes?.[0]?.geometry;
            if (geom && geom.coordinates) {
              const coords = geom.coordinates.map(pt => [pt[1], pt[0]]);
              detailRouteLineRef.current = window.L.polyline(coords, { color: '#F97316', weight: 5, opacity: 0.85 }).addTo(map);
              map.fitBounds(coords, { padding: [40, 40] });
              
              setMapRouteInfo({
                distanceKm: (data.routes[0].distance / 1000).toFixed(1),
                durationMinutes: Math.round(data.routes[0].duration / 60)
              });
              return;
            }
          }
        } catch (err) {
          console.error('Failed to load OSRM routing in TripDetail:', err);
        }
        
        // Fallback straight line
        detailRouteLineRef.current = window.L.polyline(bounds, { color: '#F97316', weight: 4 }).addTo(map);
        map.fitBounds(bounds, { padding: [50, 50] });
        setMapRouteInfo(null);
      };
      fetchRoute();
    } else {
      map.setView([lat, lng], 15);
      setMapRouteInfo(null);
    }
  }, [mapTarget]);

  // Sync packing list text area input on load
  useEffect(() => {
    if (trip?.packingList?.customItems) {
      setPackingInput(trip.packingList.customItems.map(it => it.name).join('\n'));
    }
  }, [trip]);

  // Actions
  const shareTrip = async () => {
    const r = await run(() => api(`/trips/${trip._id}/share`, { method: 'POST' }), 'Đã tạo mã chia sẻ.');
    if (r?.data) setSelectedTrip({ ...trip, shareCode: r.data.shareCode || r.data.code || r.data });
  };

  const savePackingList = async () => {
    const lines = packingInput.split('\n').map(s => s.trim()).filter(Boolean);
    const existingChecked = trip.packingList?.checkedItems || {};
    const customItems = lines.map(name => ({ name }));
    const checkedItems = {};
    lines.forEach(name => {
      checkedItems[name] = !!existingChecked[name];
    });
    const payload = {
      selectedModes: trip.packingList?.selectedModes || [],
      customItems,
      checkedItems
    };

    const originalTrip = trip;
    // Optimistic UI Update
    setSelectedTrip(prev => ({
      ...prev,
      packingList: {
        ...(prev.packingList || {}),
        customItems,
        checkedItems
      }
    }));

    try {
      const res = await api(`/trips/${trip._id}/packing-list`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res?.data) {
        setSelectedTrip(prev => ({
          ...prev,
          packingList: res.data
        }));
      }
    } catch (err) {
      console.error('Failed to save packing list:', err);
      setSelectedTrip(originalTrip);
    }
  };

  const togglePackingItem = async (itemName) => {
    const customItems = trip.packingList?.customItems || [];
    const checkedItems = { ...(trip.packingList?.checkedItems || {}) };
    checkedItems[itemName] = !checkedItems[itemName];
    const payload = {
      selectedModes: trip.packingList?.selectedModes || [],
      customItems: customItems.map(it => ({ id: it.id || it._id, name: it.name })),
      checkedItems
    };

    const originalTrip = trip;
    // Optimistic UI Update
    setSelectedTrip(prev => ({
      ...prev,
      packingList: {
        ...(prev.packingList || {}),
        checkedItems
      }
    }));

    try {
      const res = await api(`/trips/${trip._id}/packing-list`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res?.data) {
        setSelectedTrip(prev => ({
          ...prev,
          packingList: res.data
        }));
      }
    } catch (err) {
      console.error('Failed to update packing list item:', err);
      setSelectedTrip(originalTrip);
    }
  };

  const deleteTrip = async () => {
    if (!confirm('Xóa chuyến đi này?')) return;
    const r = await run(() => api(`/trips/${trip._id}`, { method: 'DELETE' }), 'Đã xóa.');
    if (r) { setSelectedTrip(null); go('trips'); }
  };

  const optimizeDay = async (day, dayActivities) => {
    const activitiesWithCoords = dayActivities.filter((activity) => getEntityCoords(activity.coordinates, activity.location, activity));
    if (activitiesWithCoords.length < 3) {
      alert('Cần ít nhất 3 hoạt động có tọa độ để tối ưu đường đi trong ngày này.');
      return;
    }

    setOptimizingDay(day);
    try {
      const optimized = await run(() => api(`/trips/${trip._id}/optimize-day`, {
        method: 'POST',
        body: JSON.stringify({ activities: dayActivities, day }),
      }), 'Đã tối ưu thứ tự di chuyển.');
      if (!optimized?.data?.activities) return;
      if (!confirm(`Áp dụng thứ tự mới cho Ngày ${day}?`)) return;

      const otherActivities = (trip.activities || []).filter((activity) => Number(activity.day || 1) !== Number(day));
      const updated = await run(() => api(`/trips/${trip._id}`, {
        method: 'PUT',
        body: JSON.stringify({ activities: [...otherActivities, ...optimized.data.activities] }),
      }), 'Đã lưu lịch trình tối ưu.');
      if (updated?.data) setSelectedTrip(updated.data);
    } finally {
      setOptimizingDay(null);
    }
  };

  const selectActivityOnMap = (act, idx, allDayActs) => {
    const endCoords = getEntityCoords(act.coordinates, act.location, act);
    const label = getPlaceLabel(act);
    if (!endCoords) {
      alert(`Địa điểm "${label}" chưa có tọa độ bản đồ.`);
      return;
    }

    let startLat = null;
    let startLng = null;
    let startLabel = 'Vị trí của bạn';

    if (idx > 0) {
      const prevAct = allDayActs[idx - 1];
      const prevCoords = getEntityCoords(prevAct.coordinates, prevAct.location, prevAct);
      startLat = prevCoords?.lat;
      startLng = prevCoords?.lng;
      startLabel = getPlaceLabel(prevAct) || 'Điểm trước đó';
    }

    if (!startLat && userCoords) {
      startLat = userCoords.lat;
      startLng = userCoords.lng;
    }

    setMapTarget({
      name: label,
      lat: endCoords.lat,
      lng: endCoords.lng,
      startLat,
      startLng,
      startLabel
    });
  };

  const selectRestaurantOnMap = (r) => {
    const endCoords = getEntityCoords(r.location, r.coordinates, r);
    if (!endCoords) {
      alert(`Nhà hàng "${r.name}" chưa có tọa độ bản đồ.`);
      return;
    }
    setMapTarget({
      name: r.name,
      lat: endCoords.lat,
      lng: endCoords.lng,
      startLat: userCoords?.lat,
      startLng: userCoords?.lng,
      startLabel: 'Vị trí của bạn'
    });
  };

  if (isEditing) {
    return <TripEditor
      trip={trip}
      api={api}
      run={run}
      onCancel={() => setIsEditing(false)}
      onSaved={(updated) => { setSelectedTrip(updated); setIsEditing(false); }}
    />;
  }

  return (
    <div className="animate-in trip-detail-container">
      <div className="trip-detail-content">
        {/* Hero */}
        <div className="trip-hero">
          <div className="trip-hero-top">
            <button className="ghost icon-text" style={{ color: 'white', padding: '6px 12px' }} onClick={() => go('trips')}><UiIcon icon={ArrowLeft} />Quay lại</button>
            <div className="trip-hero-actions">
              <button className="icon-text" onClick={() => loadTripDetail(trip._id)}><UiIcon icon={RotateCcw} />Tải lại</button>
              <button className="icon-text" onClick={() => setIsEditing(true)}><UiIcon icon={Pencil} />Chỉnh sửa</button>
              <button className="icon-text" onClick={() => window.print()}><UiIcon icon={Printer} />Xuất / In PDF</button>
              <button className="icon-text" onClick={shareTrip}><UiIcon icon={Link2} />Chia sẻ</button>
              <button className="icon-text" onClick={deleteTrip}><UiIcon icon={Trash2} />Xóa</button>
            </div>
          </div>
          <div className="trip-hero-dest"><UiIcon icon={MapPinned} size={30} />{trip.destination}</div>
          <div className="trip-hero-meta">
            <span><UiIcon icon={CalendarDays} size={16} />{dateText(trip.startDate)} - {dateText(trip.endDate)}</span>
            <span><UiIcon icon={UsersRound} size={16} />{trip.totalPeople || 1} người</span>
            {trip.shareCode && <span><UiIcon icon={Link2} size={16} />Mã chia sẻ: {trip.shareCode}</span>}
          </div>
          <div className="trip-hero-budget">Ngân sách: <strong>{money(trip.budget)}</strong></div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Dự kiến chi</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{money(trip.budgetStats?.totalExpenses || trip.totalEstimatedCost || 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Còn lại</div>
            <div className="stat-value" style={{ color: (trip.budgetStats?.remainingBudget || 0) < 0 ? 'var(--error)' : 'var(--success)' }}>{money(trip.budgetStats?.remainingBudget || trip.remainingBudget || 0)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-subnav">
          {TABS.map((t, i) => <button key={t} className={detailTab === i ? 'active' : ''} onClick={() => setDetailTab(i)}>{t}</button>)}
        </div>

        {/* Tab Content */}
        {detailTab === 0 && (
          <div className="animate-in">
            {Object.entries(days).length === 0 ? <div className="card card-pad"><div className="empty-state"><div className="empty-state-icon"><UiIcon icon={MapPinned} size={36} /></div><div className="empty-state-text">Chưa có lịch trình</div></div></div> : (
              <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
                {Object.entries(days).map(([day, acts]) => (
                  <div className="timeline-day" key={day}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <h3 className="timeline-day-title">Ngày {day}</h3>
                      <button onClick={() => optimizeDay(day, acts)} disabled={optimizingDay === day}>
                        <><UiIcon icon={Zap} />{optimizingDay === day ? 'Đang tối ưu...' : 'Tối ưu đường đi'}</>
                      </button>
                    </div>
                    {acts.map((a, idx) => (
                      <div 
                        className="activity-card" 
                        key={a._id || `${a.day}-${idx}-${a.location}`}
                        onClick={() => selectActivityOnMap(a, idx, acts)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="activity-line"><div className="activity-dot" /><div className="activity-connector" /></div>
                        <div className="activity-body">
                          <div className="activity-time">{a.time || '--:--'}</div>
                          <div className="activity-location">{a.location}</div>
                          {a.address && <div className="activity-desc">{a.address}</div>}
                          {a.description && <div className="activity-desc">{a.description}</div>}
                          <div className="activity-tags">
                            {a.category && <span className="activity-tag">{a.category}</span>}
                            {a.transport && <span className="activity-tag"><UiIcon icon={Car} size={14} />{a.transport}</span>}
                            {a.cost > 0 && <span className="activity-tag" style={{ color: 'var(--primary)', background: 'var(--primary-50)' }}>{money(a.cost)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {detailTab === 1 && <div className="card card-pad animate-in"><InfoBox title="Gợi ý nơi ở" icon={Hotel} data={trip.hotelRecommendation} fallback="Chưa có gợi ý." /></div>}
        {detailTab === 2 && (
          <div className="animate-in">
            <ResultList 
              empty="Chưa có gợi ý ăn uống." 
              items={trip.restaurantRecommendations || []} 
              render={(r) => (
                <div 
                  onClick={() => selectRestaurantOnMap(r)} 
                  style={{ display: 'flex', width: '100%', cursor: 'pointer', gap: 12 }}
                >
                  <div className="item-icon" style={{ background: 'rgba(245,158,11,0.1)' }}><UiIcon icon={Compass} /></div>
                  <div style={{ flex: 1 }}>
                    <h3>{r.name}</h3>
                    <p>{r.address}</p>
                    <small>{r.cuisineType} · {money(r.averagePricePerPerson)}/người</small>
                  </div>
                  <span style={{ color: 'var(--primary)', alignSelf: 'center' }}><UiIcon icon={Navigation} /></span>
                </div>
              )} 
            />
          </div>
        )}
        {detailTab === 3 && <div className="card card-pad animate-in"><InfoBox title="Phân bổ ngân sách" icon={WalletCards} data={trip.budgetBreakdown} fallback="Chưa có breakdown." formatter={money} /></div>}
        {detailTab === 4 && (
          <div className="card card-pad animate-in">
            <h3 className="icon-text" style={{ marginBottom: 14 }}><UiIcon icon={Backpack} />Packing list</h3>
            <textarea value={packingInput} onChange={(e) => setPackingInput(e.target.value)} placeholder="Mỗi dòng một món cần mang" style={{ marginBottom: 12 }} />
            <button className="primary" onClick={savePackingList} style={{ marginBottom: 16 }}>Lưu packing list</button>
            {(trip.packingList?.customItems || []).map((it) => {
              const isChecked = !!trip.packingList?.checkedItems?.[it.name];
              return (
                <div 
                  className="packing-item" 
                  key={it.id || it._id || it.name} 
                  onClick={() => togglePackingItem(it.name)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}
                >
                  <span style={{ fontSize: 16 }}>{isChecked ? '✅' : '⬜'}</span>
                  <span style={{ textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'var(--gray-400)' : 'inherit' }}>
                    {it.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {detailTab === 5 && (
          <div className="animate-in">
            {tripWeather && tripWeather.forecast ? (
              <div className="weather-forecast-grid">
                {tripWeather.forecast.map((w, idx) => (
                  <div className="weather-day-card" key={idx}>
                    <div className="weather-day-header">
                      <span className="weather-day-title">{dateText(w.date)} (Ngày {w.day})</span>
                      <span className="weather-day-icon">
                        <WeatherIcon type={w.icon} />
                      </span>
                    </div>
                    <div className="weather-day-temp">{w.temp}</div>
                    <div className="weather-day-desc">{w.statusLabel}</div>
                    <div className="weather-day-meta">
                      <span className="icon-text"><UiIcon icon={Umbrella} size={15} />Mưa: {w.rainProbability || '0%'}</span>
                      <span className="icon-text"><UiIcon icon={Navigation} size={15} />Gió: {w.windSpeed || '0 km/h'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card card-pad">
                <div className="empty-state">
                  <div className="empty-state-text">Đang tải dự báo thời tiết cho {trip.destination}...</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="trip-detail-map-sidebar">
        <h3 className="icon-text"><UiIcon icon={Compass} />Bản đồ & Chỉ đường</h3>
        <div id="trip-detail-map" className="map-container-inner"></div>
        {mapTarget && (
          <div className="map-info-box animate-in">
            <div className="icon-text"><UiIcon icon={MapPinned} size={16} /><strong>Điểm đến:</strong> {mapTarget.name}</div>
            {mapRouteInfo && (
              <div style={{ marginTop: 4, color: 'var(--primary-dark)', fontWeight: 700 }}>
                <span className="icon-text"><UiIcon icon={Car} size={16} />Quãng đường: {mapRouteInfo.distanceKm} km · Thời gian: {mapRouteInfo.durationMinutes} phút</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRIP EDITOR
   ═══════════════════════════════════════════════════════════ */
function TripEditor({ trip, api, run, onCancel, onSaved }) {
  const [tripForm, setTripForm] = useState({
    destination: trip.destination || '',
    startDate: String(trip.startDate || '').slice(0, 10),
    endDate: String(trip.endDate || '').slice(0, 10),
    budget: trip.budget || 0,
    totalPeople: trip.totalPeople || 1,
    travelStyle: trip.travelStyle || 'CHILL',
    interests: Array.isArray(trip.interests) ? trip.interests.join(', ') : (trip.interests || ''),
    tripType: trip.tripType || 'Solo',
  });
  const [activities, setActivities] = useState(() => (trip.activities || []).map((activity) => ({ ...activity })));
  const [hotel, setHotel] = useState(() => ({ ...(trip.hotelRecommendation || {}) }));
  const [restaurants, setRestaurants] = useState(() => (trip.restaurantRecommendations || []).map((restaurant) => ({ ...restaurant })));
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [activityPlaceSearches, setActivityPlaceSearches] = useState({});

  const patchActivity = (index, key, value) => {
    setActivities((items) => items.map((activity, itemIndex) => itemIndex === index ? { ...activity, [key]: value } : activity));
  };
  const addActivity = () => {
    setActivities((items) => [...items, {
      day: 1, time: '08:00', endTime: '', location: '', address: '', description: '',
      category: 'PLACE', transport: 'OTHER', cost: 0, durationMinutes: 60,
    }]);
  };
  const removeActivity = (index) => {
    setActivities((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setActivityPlaceSearches((items) => {
      const next = {};
      Object.entries(items).forEach(([key, value]) => {
        const numericKey = Number(key);
        if (numericKey < index) next[numericKey] = value;
        if (numericKey > index) next[numericKey - 1] = value;
      });
      return next;
    });
  };
  const addRestaurant = () => {
    setRestaurants((items) => [...items, { name: '', address: '', cuisineType: '', averagePricePerPerson: 0, description: '' }]);
  };
  const buildActivityFromPlace = (place, base = {}) => {
    const coords = getEntityCoords(place.coordinates, place.location, place);
    if (!coords) {
      alert('Địa điểm này chưa có tọa độ hợp lệ để dùng trên bản đồ.');
      return null;
    }
    const categoryText = String(place.category || '').toLowerCase();
    const category = /ăn|ẩm|food|restaurant|cafe/.test(categoryText) ? 'FOOD' : /hotel|khách sạn|resort/.test(categoryText) ? 'HOTEL' : 'PLACE';
    const priceMatch = String(place.ticketPrice || '').match(/[0-9][0-9.,\s]*/);
    const cost = priceMatch ? Number(priceMatch[0].replace(/\D/g, '')) || 0 : Number(base.cost || 0);

    return {
      ...base,
      location: place.name || '',
      address: place.address || '',
      description: place.introduction || place.description || base.description || '',
      category,
      cost,
      placeId: place._id,
      coordinates: coords,
    };
  };
  const searchPlaces = async () => {
    const query = placeQuery.trim();
    if (!query) return;
    const result = await run(() => api(`/places/search?q=${encodeURIComponent(query)}&limit=8`));
    if (result?.data) setPlaceResults(result.data);
  };
  const addPlaceToItinerary = (place) => {
    const activity = buildActivityFromPlace(place, {
      day: 1,
      time: '08:00',
      endTime: '',
      transport: 'OTHER',
      durationMinutes: 60,
    });
    if (!activity) return;
    setActivities((items) => [...items, activity]);
    setPlaceResults([]);
    setPlaceQuery('');
  };
  const setActivityPlaceQuery = (index, query) => {
    setActivityPlaceSearches((items) => ({
      ...items,
      [index]: { ...(items[index] || {}), query },
    }));
  };
  const searchActivityPlaces = async (index) => {
    const query = String(activityPlaceSearches[index]?.query || '').trim();
    if (!query) return;
    const result = await run(() => api(`/places/search?q=${encodeURIComponent(query)}&limit=6`));
    setActivityPlaceSearches((items) => ({
      ...items,
      [index]: { ...(items[index] || {}), results: result?.data || [] },
    }));
  };
  const applyPlaceToActivity = (index, place) => {
    const nextActivity = buildActivityFromPlace(place, activities[index] || {});
    if (!nextActivity) return;
    setActivities((items) => items.map((activity, itemIndex) => itemIndex === index ? nextActivity : activity));
    setActivityPlaceSearches((items) => ({
      ...items,
      [index]: { query: '', results: [] },
    }));
  };
  const save = async (event) => {
    event.preventDefault();
    const payload = {
      ...tripForm,
      budget: Number(tripForm.budget || 0),
      totalPeople: Math.max(Number(tripForm.totalPeople || 1), 1),
      interests: String(tripForm.interests || '').split(',').map((item) => item.trim()).filter(Boolean),
      activities: activities
        .filter((activity) => String(activity.location || '').trim())
        .map((activity) => ({
          ...activity,
          day: Math.max(Number(activity.day || 1), 1),
          cost: Number(activity.cost || 0),
          durationMinutes: Number(activity.durationMinutes || 0),
        })),
      hotelRecommendation: hotel.name ? {
        name: hotel.name, address: hotel.address || '', area: hotel.area || '',
        estimatedCostPerNight: Number(hotel.estimatedCostPerNight || hotel.pricePerNight || 0),
        rating: Number(hotel.rating || 0), description: hotel.description || '',
      } : null,
      restaurantRecommendations: restaurants
        .filter((restaurant) => String(restaurant.name || '').trim())
        .map((restaurant) => ({
          ...restaurant,
          averagePricePerPerson: Number(restaurant.averagePricePerPerson || 0),
          rating: Number(restaurant.rating || 0),
        })),
    };
    const result = await run(() => api(`/trips/${trip._id}`, { method: 'PUT', body: JSON.stringify(payload) }), 'Đã lưu thay đổi lịch trình.');
    if (result?.data) onSaved(result.data);
  };

  return (
    <div className="animate-in">
      <div className="button-row" style={{ marginBottom: 16 }}>
        <button className="icon-text" onClick={onCancel}><UiIcon icon={ArrowLeft} />Quay lại chi tiết</button>
      </div>
      <form className="form-stack" onSubmit={save}>
        <div className="card card-pad">
          <h2 style={{ marginBottom: 16 }}>Chỉnh sửa chuyến đi</h2>
          <div className="form-grid form-grid-3">
            <TextInput label="Điểm đến" value={tripForm.destination} onChange={(value) => setTripForm({ ...tripForm, destination: value })} />
            <TextInput label="Ngày đi" type="date" value={tripForm.startDate} onChange={(value) => setTripForm({ ...tripForm, startDate: value })} />
            <TextInput label="Ngày về" type="date" value={tripForm.endDate} onChange={(value) => setTripForm({ ...tripForm, endDate: value })} />
            <TextInput label="Ngân sách" type="number" value={tripForm.budget} onChange={(value) => setTripForm({ ...tripForm, budget: value })} />
            <TextInput label="Số người" type="number" value={tripForm.totalPeople} onChange={(value) => setTripForm({ ...tripForm, totalPeople: value })} />
            <TextInput label="Phong cách" value={tripForm.travelStyle} onChange={(value) => setTripForm({ ...tripForm, travelStyle: value })} />
            <div className="full"><TextInput label="Sở thích (ngăn cách bằng dấu phẩy)" value={tripForm.interests} onChange={(value) => setTripForm({ ...tripForm, interests: value })} /></div>
          </div>
        </div>

        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h3>Lịch trình và di chuyển</h3><button className="icon-text" type="button" onClick={addActivity}><UiIcon icon={Plus} />Thêm hoạt động</button>
          </div>
          <div className="inline-form">
            <input
              value={placeQuery}
              onChange={(event) => setPlaceQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  searchPlaces();
                }
              }}
              placeholder="Tìm địa điểm trong database TravelMate..."
            />
            <button className="icon-text" type="button" onClick={searchPlaces}><UiIcon icon={Search} />Tìm</button>
          </div>
          {placeResults.length > 0 && <div className="editor-place-results">
            {placeResults.map((place) => <div className="editor-place-item" key={place._id || place.name}>
              <div><strong>{place.name}</strong><p>{place.address}</p><small>{place.category} · {place.ticketPrice || 'Miễn phí'}</small></div>
              <button className="primary icon-text" type="button" onClick={() => addPlaceToItinerary(place)}><UiIcon icon={Plus} size={16} />Thêm vào lịch trình</button>
            </div>)}
          </div>}
          {activities.length === 0 && <p className="muted">Chưa có hoạt động. Thêm điểm đến để tự thiết kế lịch trình.</p>}
          {activities.map((activity, index) => (
            <div className="activity-editor" key={activity._id || `activity-${index}`}>
              <div className="form-grid form-grid-3">
                <TextInput label="Ngày" type="number" value={activity.day || 1} onChange={(value) => patchActivity(index, 'day', value)} />
                <TextInput label="Bắt đầu" type="time" value={activity.time || ''} onChange={(value) => patchActivity(index, 'time', value)} />
                <TextInput label="Kết thúc" type="time" value={activity.endTime || ''} onChange={(value) => patchActivity(index, 'endTime', value)} />
                <div className="full activity-place-picker">
                  <label>Địa điểm trong database</label>
                  <div className="activity-selected-place">
                    <div>
                      <strong>{activity.location || 'Chưa chọn địa điểm'}</strong>
                      {activity.address && <p>{activity.address}</p>}
                    </div>
                    {activity.placeId && <span>Đã chọn lọc</span>}
                  </div>
                  <div className="inline-form">
                    <input
                      value={activityPlaceSearches[index]?.query || ''}
                      onChange={(event) => setActivityPlaceQuery(index, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          searchActivityPlaces(index);
                        }
                      }}
                      placeholder="Nhập tên địa điểm để tìm trên bản đồ..."
                    />
                    <button className="icon-text" type="button" onClick={() => searchActivityPlaces(index)}><UiIcon icon={Search} />Tìm</button>
                  </div>
                  {(activityPlaceSearches[index]?.results || []).length > 0 && (
                    <div className="editor-place-results compact">
                      {activityPlaceSearches[index].results.map((place) => (
                        <div className="editor-place-item" key={place._id || place.name}>
                          <div><strong>{place.name}</strong><p>{place.address}</p><small>{place.category} · {place.ticketPrice || 'Miễn phí'}</small></div>
                          <button className="primary icon-text" type="button" onClick={() => applyPlaceToActivity(index, place)}><UiIcon icon={MapPinned} size={16} />Chọn</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <TextInput label="Danh mục" value={activity.category || 'PLACE'} onChange={(value) => patchActivity(index, 'category', value)} />
                <TextInput label="Chi phí" type="number" value={activity.cost || 0} onChange={(value) => patchActivity(index, 'cost', value)} />
                <TextInput label="Di chuyển" value={activity.transport || 'OTHER'} onChange={(value) => patchActivity(index, 'transport', value)} />
                <TextInput label="Thời lượng (phút)" type="number" value={activity.durationMinutes || 0} onChange={(value) => patchActivity(index, 'durationMinutes', value)} />
                <TextInput label="Địa chỉ" value={activity.address || ''} onChange={(value) => patchActivity(index, 'address', value)} />
                <div className="full"><TextInput label="Mô tả" value={activity.description || ''} onChange={(value) => patchActivity(index, 'description', value)} /></div>
              </div>
              <button className="danger" type="button" onClick={() => removeActivity(index)} style={{ marginTop: 12 }}>Xóa hoạt động</button>
            </div>
          ))}
        </div>

        <div className="content-grid">
          <div className="card card-pad">
            <h3 style={{ marginBottom: 16 }}>Nơi ở gợi ý</h3>
            <div className="form-stack">
              <TextInput label="Tên nơi ở" value={hotel.name || ''} onChange={(value) => setHotel({ ...hotel, name: value })} />
              <TextInput label="Địa chỉ" value={hotel.address || ''} onChange={(value) => setHotel({ ...hotel, address: value })} />
              <TextInput label="Khu vực" value={hotel.area || ''} onChange={(value) => setHotel({ ...hotel, area: value })} />
              <TextInput label="Giá/đêm" type="number" value={hotel.estimatedCostPerNight || hotel.pricePerNight || 0} onChange={(value) => setHotel({ ...hotel, estimatedCostPerNight: value })} />
            </div>
          </div>
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}><h3>Ăn uống gợi ý</h3><button className="icon-text" type="button" onClick={addRestaurant}><UiIcon icon={Plus} />Thêm</button></div>
            {restaurants.map((restaurant, index) => <div className="form-stack" key={restaurant._id || `restaurant-${index}`} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--gray-200)' }}>
              <TextInput label="Tên" value={restaurant.name || ''} onChange={(value) => setRestaurants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: value } : item))} />
              <TextInput label="Địa chỉ" value={restaurant.address || ''} onChange={(value) => setRestaurants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, address: value } : item))} />
              <TextInput label="Giá/người" type="number" value={restaurant.averagePricePerPerson || 0} onChange={(value) => setRestaurants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, averagePricePerPerson: value } : item))} />
              <button className="danger" type="button" onClick={() => setRestaurants((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Xóa</button>
            </div>)}
          </div>
        </div>
        <button className="primary" type="submit" style={{ width: '100%', padding: 14 }}>Lưu toàn bộ thay đổi</button>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PLACES
   ═══════════════════════════════════════════════════════════ */
function PlacesPanel({ api, run, places, setPlaces, loading }) {
  const [query, setQuery] = useState('Ngũ Hành Sơn');
  const [estimate, setEstimate] = useState(null);
  const [rf, setRf] = useState({ fromLat: '16.0678', fromLng: '108.2208', toLat: '16.0619', toLng: '108.2272', vehicle: 'motorcycle' });
  const [routePoints, setRoutePoints] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const mapInstanceRef = React.useRef(null);
  const startMarkerRef = React.useRef(null);
  const endMarkerRef = React.useRef(null);
  const routeLineRef = React.useRef(null);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          setRf(prev => ({ ...prev, fromLat: lat, fromLng: lng }));
        },
        (err) => {
          console.warn('Auto geolocation failed:', err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  React.useEffect(() => {
    setRoutePoints([]);
  }, [rf.fromLat, rf.fromLng, rf.toLat, rf.toLng]);

  const getCurrentLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ định vị GPS.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ fromLat: pos.coords.latitude.toFixed(6), fromLng: pos.coords.longitude.toFixed(6) }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

  React.useEffect(() => {
    if (!selectedPlace || !window.L) return;
    if (mapInstanceRef.current) return;

    const map = window.L.map('places-map').setView([16.0678, 108.2208], 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedPlace]);

  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!selectedPlace || !map || !window.L) return;

    if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
    if (endMarkerRef.current) map.removeLayer(endMarkerRef.current);
    if (routeLineRef.current) map.removeLayer(routeLineRef.current);

    const startLat = parseFloat(rf.fromLat);
    const startLng = parseFloat(rf.fromLng);
    const endLat = parseFloat(rf.toLat);
    const endLng = parseFloat(rf.toLng);

    const bounds = [];

    if (!isNaN(startLat) && !isNaN(startLng)) {
      startMarkerRef.current = window.L.marker([startLat, startLng], {
        title: 'Vị trí bắt đầu',
        icon: window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #F97316; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        })
      }).addTo(map).bindPopup('Vị trí xuất phát của bạn');
      bounds.push([startLat, startLng]);
    }

    if (!isNaN(endLat) && !isNaN(endLng)) {
      endMarkerRef.current = window.L.marker([endLat, endLng], {
        title: 'Điểm đến'
      }).addTo(map).bindPopup('Điểm đến');
      bounds.push([endLat, endLng]);
    }

    if (routePoints && routePoints.length > 0) {
      routeLineRef.current = window.L.polyline(routePoints, { color: '#F97316', weight: 5, opacity: 0.85 }).addTo(map);
      map.fitBounds(routePoints, { padding: [50, 50] });
    } else if (bounds.length === 2) {
      routeLineRef.current = window.L.polyline(bounds, { color: '#F97316', weight: 4 }).addTo(map);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [selectedPlace, rf.fromLat, rf.fromLng, rf.toLat, rf.toLng, routePoints]);

  const search = async (e) => {
    e.preventDefault();
    const r = await run(() => api(`/places/search?q=${encodeURIComponent(query)}&limit=20`), 'Tìm thấy!');
    if (r?.data) setPlaces(r.data);
  };

  const calculateRoute = async (routeForm) => {
    const r = await run(() => api(`/navigation/estimate?${new URLSearchParams(routeForm)}`), 'Đã tính đường đi!');
    if (r?.data) {
      setEstimate(r.data);
      try {
        const startLat = parseFloat(routeForm.fromLat);
        const startLng = parseFloat(routeForm.fromLng);
        const endLat = parseFloat(routeForm.toLat);
        const endLng = parseFloat(routeForm.toLng);
        if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng)) {
          const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
          if (response.ok) {
            const result = await response.json();
            const geom = result.routes?.[0]?.geometry;
            if (geom && geom.coordinates) {
              const coords = geom.coordinates.map(pt => [pt[1], pt[0]]);
              setRoutePoints(coords);
            }
          }
        }
      } catch (err) {
        console.error('OSRM route fetch failed:', err);
      }
    }
  };

  const selectDestination = async (p) => {
    const coords = getEntityCoords(p.coordinates, p.location, p);
    if (!coords) {
      alert('Địa điểm này chưa có tọa độ hợp lệ để dẫn đường.');
      return;
    }
    setSelectedPlace(p);
    setRoutePoints([]);
    let routeForm = { ...rf, toLat: String(coords.lat), toLng: String(coords.lng) };
    try {
      const currentLocation = await getCurrentLocation();
      routeForm = { ...routeForm, ...currentLocation };
    } catch (error) {
      console.warn('Cannot use current GPS location:', error.message);
    }
    setRf(routeForm);
    await calculateRoute(routeForm);
  };

  const requestLocation = async () => {
    try {
      const currentLocation = await getCurrentLocation();
      const routeForm = { ...rf, ...currentLocation };
      setRf(routeForm);
      if (selectedPlace) await calculateRoute(routeForm);
    } catch (error) {
      alert(`Không thể lấy vị trí: ${error.message}. Vui lòng kiểm tra quyền vị trí.`);
    }
  };

  const changeVehicle = async (vehicle) => {
    const routeForm = { ...rf, vehicle };
    setRf(routeForm);
    if (selectedPlace) await calculateRoute(routeForm);
  };

  return (
    <div className="animate-in">
      {!selectedPlace && <>
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <form className="inline-form" onSubmit={search} style={{ marginBottom: 0 }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nhập tên địa điểm..." />
            <button className="primary icon-text" type="submit"><UiIcon icon={Search} />Tìm kiếm</button>
          </form>
        </div>

        {loading && places.length === 0 ? (
          <Skeleton type="list" rows={4} />
        ) : (
          <ResultList
            items={places}
            empty="Chưa có địa điểm. Hãy tìm kiếm điểm đến của bạn."
            render={(p) => (
              <>
                <div className="item-icon" style={{ background: 'rgba(59,130,246,0.1)' }}><UiIcon icon={MapPinned} /></div>
                <div style={{ flex: 1 }}>
                  <h3>{p.name}</h3>
                  <p>{p.address}</p>
                  <small>{p.category} · {p.ticketPrice || 'Miễn phí'}</small>
                </div>
                <button className="ghost icon-text" type="button" onClick={() => selectDestination(p)} style={{ alignSelf: 'center', fontSize: 12 }}>
                  <UiIcon icon={Navigation} />Chọn địa điểm
                </button>
              </>
            )}
          />
        )}
      </>}

      {selectedPlace && <div className="route-destination-card">
        <div><span className="route-destination-icon"><UiIcon icon={MapPinned} size={22} /></span><div><strong>{selectedPlace.name}</strong><p>{selectedPlace.address || 'Địa điểm đã chọn'}</p></div></div>
        <button className="ghost icon-text" type="button" onClick={() => { setSelectedPlace(null); setEstimate(null); setRoutePoints([]); }}><UiIcon icon={Search} />Đổi địa điểm</button>
      </div>}

      {selectedPlace && <div className="card card-pad" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 className="icon-text" style={{ margin: 0 }}><UiIcon icon={Compass} />Chỉ đường & Bản đồ</h3>
          <button type="button" className="ghost" onClick={requestLocation} style={{ color: 'var(--primary)', padding: '6px 12px', fontSize: 13 }}>
            <UiIcon icon={LocateFixed} />Định vị vị trí của tôi
          </button>
        </div>

        <div id="places-map" className="map-container"></div>

        {selectedPlace && <div className="route-controls">
          <label>Phương tiện
            <select value={rf.vehicle} onChange={(e) => changeVehicle(e.target.value)} style={{ marginTop: 4 }}>
              <option value="motorcycle">Xe máy (Motorcycle)</option>
              <option value="car">Ô tô (Car)</option>
              <option value="foot">Đi bộ (Foot)</option>
              <option value="bike">Xe đạp (Bike)</option>
            </select>
          </label>
          <button className="primary icon-text" type="button" onClick={() => calculateRoute(rf)}><UiIcon icon={Route} />Tính lại đường đi</button>
        </div>}

        {estimate && (
          <div className="map-estimate-info">
            <div className="map-est-box">
              <div className="map-est-label">Khoảng cách</div>
              <div className="map-est-value">{estimate.distanceKm} km</div>
            </div>
            <div className="map-est-box">
              <div className="map-est-label">Thời gian dự kiến</div>
              <div className="map-est-value">{estimate.durationMinutes} phút</div>
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXPENSES
   ═══════════════════════════════════════════════════════════ */
function ExpensesPanel({ api, run, trips, expenses, setExpenses, loading }) {
  const [tripId, setTripId] = useState('');
  const [form, setForm] = useState({ title: '', amount: '', category: 'FOOD', paidAt: today, note: '' });
  const [bill, setBill] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const load = async () => {
    if (!tripId) return;
    const r = await run(() => api(`/trips/${tripId}/expenses`));
    if (r?.data) setExpenses(r.data);
  };
  const resetForm = () => {
    setEditingExpense(null);
    setBill(null);
    setForm({ title: '', amount: '', category: 'FOOD', paidAt: today, note: '' });
  };
  const save = async (e) => {
    e.preventDefault(); if (!tripId) return;
    const fd = new FormData(); Object.entries(form).forEach(([k, v]) => fd.append(k, v)); if (bill) fd.append('bill', bill);
    const path = editingExpense ? `/expenses/${editingExpense._id}` : `/trips/${tripId}/expenses`;
    const method = editingExpense ? 'PUT' : 'POST';
    const r = await run(() => api(path, { method, body: fd }), editingExpense ? 'Đã cập nhật chi phí.' : 'Đã thêm chi phí.');
    if (r) { resetForm(); load(); }
  };
  const edit = (expense) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title || '', amount: String(expense.amount || ''), category: expense.category || 'OTHER',
      paidAt: String(expense.paidAt || today).slice(0, 10), note: expense.note || '',
    });
    setBill(null);
  };
  const remove = async (expense) => {
    if (!confirm(`Xóa khoản chi "${expense.title}"?`)) return;
    const r = await run(() => api(`/expenses/${expense._id}`, { method: 'DELETE' }), 'Đã xóa chi phí.');
    if (r) load();
  };
  return (
    <div className="animate-in">
      <div className="content-grid">
        <div>
          <div className="card card-pad">
            <TripSelect trips={trips} value={tripId} onChange={setTripId} />
            <button className="icon-text" onClick={load} style={{ width: '100%', marginTop: 12 }}><UiIcon icon={RotateCcw} />Tải chi phí</button>
          </div>
          {loading && !expenses && tripId ? (
            <div style={{ marginTop: 20 }}>
              <Skeleton type="list" rows={3} />
            </div>
          ) : (
            <>
              {expenses && (
                <div className="stats-grid" style={{ marginTop: 20 }}>
                  <div className="stat-card"><div className="stat-label">Dự kiến</div><div className="stat-value" style={{ color: 'var(--primary)' }}>{money(expenses.summary?.plannedTotal)}</div></div>
                  <div className="stat-card"><div className="stat-label">Đã chi</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{money(expenses.summary?.totalSpent)}</div></div>
                  <div className="stat-card"><div className="stat-label">Còn lại</div><div className="stat-value" style={{ color: 'var(--success)' }}>{money(expenses.summary?.remainingBudget)}</div></div>
                </div>
              )}
              <div style={{ marginTop: 20 }}>
                <ResultList title="Khoản chi đã nhập" items={expenses?.data || []} empty="Chưa có chi phí." render={(x) => (<><div className="item-icon" style={{ background: 'rgba(16,185,129,0.1)' }}><UiIcon icon={Receipt} /></div><div style={{ flex: 1 }}><h3>{x.title}</h3><p>{x.categoryLabel || x.category} · {dateText(x.paidAt)}</p><small style={{ color: 'var(--primary)', fontWeight: 700 }}>{money(x.amount)}</small>{x.billImageUrl && <a href={x.billImageUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 4 }}>Xem bill</a>}</div><div className="button-column"><button className="icon-only" title="Sửa" onClick={() => edit(x)}><UiIcon icon={Pencil} size={16} /></button><button className="danger icon-only" title="Xóa" onClick={() => remove(x)}><UiIcon icon={Trash2} size={16} /></button></div></>)} />
                <ResultList title="Chi phí dự kiến" items={expenses?.plannedExpenses || []} empty="Chưa có chi phí dự kiến từ lịch trình." render={(x) => (<><div className="item-icon" style={{ background: 'rgba(59,130,246,0.1)' }}><UiIcon icon={CalendarDays} /></div><div><h3>{x.title}</h3><p>{x.categoryLabel || x.category} · {x.note}</p><small style={{ color: 'var(--primary)', fontWeight: 700 }}>{money(x.amount)}</small></div></>)} />
              </div>
            </>
          )}
        </div>
        <div>
          <div className="card card-pad">
            <h3 style={{ marginBottom: 16 }}>{editingExpense ? '✏️ Sửa chi phí' : '➕ Thêm chi phí mới'}</h3>
            <form className="form-stack" onSubmit={save}>
              <TextInput label="Tên chi phí" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <TextInput label="Số tiền" type="number" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
              <label>Danh mục<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="FOOD">Ăn uống</option><option value="STAY">Lưu trú</option><option value="TRANSPORT">Di chuyển</option><option value="VISIT">Tham quan</option><option value="SHOPPING">Mua sắm</option><option value="OTHER">Khác</option></select></label>
              <TextInput label="Ngày" type="date" value={form.paidAt} onChange={(v) => setForm({ ...form, paidAt: v })} />
              <TextInput label="Ghi chú" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
              <label>Bill <input type="file" onChange={(e) => setBill(e.target.files?.[0] || null)} /></label>
              <button className="primary" type="submit" style={{ width: '100%' }}>{editingExpense ? 'Lưu thay đổi' : 'Thêm chi phí'}</button>
              {editingExpense && <button type="button" onClick={resetForm}>Hủy sửa</button>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   JOURNALS
   ═══════════════════════════════════════════════════════════ */
function JournalsPanel({ api, run, trips, journals, setJournals, user, go, loading }) {
  const [tripId, setTripId] = useState('');
  const [form, setForm] = useState({ title: '', content: '', emotion: '😊', journalDate: today });
  const [images, setImages] = useState([]);
  const [editingJournal, setEditingJournal] = useState(null);
  const [keepImages, setKeepImages] = useState([]);
  const load = async () => { if (!tripId) return; const r = await run(() => api(`/trips/${tripId}/journals`)); if (r?.data) setJournals(Array.isArray(r.data) ? r.data : r.data.journals || []); };
  const resetForm = () => {
    setEditingJournal(null); setKeepImages([]); setImages([]);
    setForm({ title: '', content: '', emotion: '😊', journalDate: today });
  };
  const save = async (e) => {
    e.preventDefault(); if (!tripId) return;
    const fd = new FormData(); Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (editingJournal) fd.append('keepImages', JSON.stringify(keepImages));
    Array.from(images).forEach(f => fd.append('images', f));
    const path = editingJournal ? `/journals/${editingJournal._id}` : `/trips/${tripId}/journals`;
    const r = await run(() => api(path, { method: editingJournal ? 'PUT' : 'POST', body: fd }), editingJournal ? 'Đã cập nhật nhật ký.' : 'Đã thêm nhật ký.');
    if (r) { resetForm(); load(); }
  };
  const edit = (journal) => {
    setEditingJournal(journal); setKeepImages(journal.imageUrls || []); setImages([]);
    setForm({ title: journal.title || '', content: journal.content || '', emotion: journal.emotion || '😊', journalDate: String(journal.journalDate || today).slice(0, 10) });
  };
  const remove = async (journal) => {
    if (!confirm(`Xóa nhật ký "${journal.title}"?`)) return;
    const r = await run(() => api(`/journals/${journal._id}`, { method: 'DELETE' }), 'Đã xóa nhật ký.'); if (r) load();
  };
  if (user?.package !== 'premium') {
    return (
      <div className="animate-in card card-pad" style={{ maxWidth: 680 }}>
        <h2 className="icon-text" style={{ marginBottom: 10 }}><UiIcon icon={BookOpen} />Nhật ký chuyến đi Premium</h2>
        <p className="muted" style={{ marginBottom: 20 }}>Nhật ký, ảnh và cảm xúc là tính năng của gói Premium.</p>
        <button className="primary" onClick={() => go('profile')}>Mua Premium - 10.000 đ</button>
      </div>
    );
  }
  return (
    <div className="animate-in">
      <div className="content-grid">
        <div>
          <div className="card card-pad"><TripSelect trips={trips} value={tripId} onChange={setTripId} /><button className="icon-text" onClick={load} style={{ width: '100%', marginTop: 12 }}><UiIcon icon={RotateCcw} />Tải nhật ký</button></div>
          <div style={{ marginTop: 20 }}>
            {loading && journals.length === 0 && tripId ? (
              <Skeleton type="list" rows={3} />
            ) : (
              <ResultList items={journals} empty="Chưa có nhật ký hoặc tài khoản chưa là Premium." render={(j) => (<><div className="item-icon" style={{ background: 'rgba(139,92,246,0.1)' }}><UiIcon icon={BookOpen} /></div><div style={{ flex: 1 }}><h3>{j.title}</h3><p>{j.content}</p><small>{j.emotion || '😊'} · {dateText(j.journalDate || j.createdAt)}</small>{(j.imageUrls || []).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 4 }}>Xem ảnh</a>)}</div><div className="button-column"><button className="icon-only" title="Sửa" onClick={() => edit(j)}><UiIcon icon={Pencil} size={16} /></button><button className="danger icon-only" title="Xóa" onClick={() => remove(j)}><UiIcon icon={Trash2} size={16} /></button></div></>)} />
            )}
          </div>
        </div>
        <div className="card card-pad">
          <h3 className="icon-text" style={{ marginBottom: 16 }}><UiIcon icon={editingJournal ? Pencil : FileText} />{editingJournal ? 'Sửa nhật ký' : 'Thêm nhật ký'}</h3>
          <form className="form-stack" onSubmit={save}>
            <TextInput label="Tiêu đề" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <TextInput label="Cảm xúc" value={form.emotion} onChange={(v) => setForm({ ...form, emotion: v })} />
            <TextInput label="Ngày" type="date" value={form.journalDate} onChange={(v) => setForm({ ...form, journalDate: v })} />
            <label>Ảnh <input multiple type="file" onChange={(e) => setImages(e.target.files || [])} /></label>
            {editingJournal && keepImages.length > 0 && <div className="form-stack"><span>Ảnh hiện có</span>{keepImages.map((url) => <label key={url}><input type="checkbox" checked={keepImages.includes(url)} onChange={() => setKeepImages((items) => items.filter((item) => item !== url))} /> Giữ ảnh đã tải</label>)}</div>}
            <label>Nội dung <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
            <button className="primary" type="submit" style={{ width: '100%' }}>{editingJournal ? 'Lưu thay đổi' : 'Thêm nhật ký'}</button>
            {editingJournal && <button type="button" onClick={resetForm}>Hủy sửa</button>}
          </form>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMMUNITY
   ═══════════════════════════════════════════════════════════ */
function CommunityPanel({ api, run, posts, setPosts, loading, user }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'Mới nhất' });
  const [image, setImage] = useState(null);
  const [localLikedPosts, setLocalLikedPosts] = useState(() => new Set());
  const loadPosts = async () => { const r = await run(() => api('/posts')); if (r?.data) setPosts(Array.isArray(r.data) ? r.data : r.data.posts || []); };
  const createPost = async (e) => {
    e.preventDefault();
    const fd = new FormData(); Object.entries(form).forEach(([k, v]) => fd.append(k, v)); if (image) fd.append('image', image);
    const r = await run(() => api('/posts', { method: 'POST', body: fd }), 'Đã gửi bài, đang chờ duyệt.');
    if (r?.data) {
      setPosts((items) => [r.data, ...items.filter((post) => post._id !== r.data._id)]);
      setForm({ title: '', content: '', category: 'Mới nhất' });
      setImage(null);
    }
  };
  const quickAction = async (path, ok, body) => {
    const likeMatch = path.match(/\/posts\/([^/]+)\/like$/);
    const commentMatch = path.match(/\/posts\/([^/]+)\/comments$/);
    const previousPosts = posts;

    if (likeMatch) {
      const postId = likeMatch[1];
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p._id === postId) {
            const isLiked = localLikedPosts.has(postId);
            const newLiked = new Set(localLikedPosts);
            if (isLiked) {
              newLiked.delete(postId);
              setLocalLikedPosts(newLiked);
              return { ...p, likesCount: Math.max(0, (p.likesCount || 0) - 1) };
            } else {
              newLiked.add(postId);
              setLocalLikedPosts(newLiked);
              return { ...p, likesCount: (p.likesCount || 0) + 1 };
            }
          }
          return p;
        })
      );
    } else if (commentMatch && body && body.content) {
      const postId = commentMatch[1];
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p._id === postId) {
            const newComment = {
              _id: Date.now().toString(),
              author: { name: user?.name || 'Bạn' },
              content: body.content,
              createdAt: new Date().toISOString(),
            };
            return {
              ...p,
              commentsCount: (p.commentsCount || 0) + 1,
              comments: [...(p.comments || []), newComment],
            };
          }
          return p;
        })
      );
    }

    try {
      const r = await api(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (r?.data) {
        if (r.data.post) {
          setPosts((prev) => prev.map((p) => (p._id === r.data.post._id ? r.data.post : p)));
        } else {
          loadPosts();
        }
      } else {
        loadPosts();
      }
    } catch (err) {
      console.error('Optimistic action failed, rolling back:', err);
      setPosts(previousPosts);
    }
  };

  return (
    <div className="animate-in">
      <div className="community-toolbar">
        <div><h2>Khám phá cộng đồng</h2><p>Chia sẻ trải nghiệm và tìm cảm hứng cho chuyến đi tiếp theo.</p></div>
        <button className="icon-text" onClick={loadPosts}><UiIcon icon={RotateCcw} />Tải bài viết</button>
      </div>
      <div className="community-layout">
        <main className="community-feed">
          {loading && posts.length === 0 ? (
            <Skeleton type="list" rows={3} />
          ) : (
            <PostList posts={posts} quickAction={quickAction} />
          )}
        </main>
        <aside className="card card-pad community-compose">
          <h3 className="icon-text" style={{ marginBottom: 16 }}><UiIcon icon={FileText} />Đăng bài mới</h3>
          <form className="form-stack" onSubmit={createPost}>
            <TextInput label="Tiêu đề" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <TextInput label="Danh mục" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <label>Nội dung <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
            <label>Ảnh <input type="file" onChange={(e) => setImage(e.target.files?.[0] || null)} /></label>
            <button className="primary" type="submit" style={{ width: '100%' }}>Đăng bài</button>
          </form>
        </aside>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WEATHER
   ═══════════════════════════════════════════════════════════ */
function WeatherPanel({ api, run, weather, setWeather, loading }) {
  const [form, setForm] = useState({ destination: 'Đà Nẵng', days: 3 });
  const submit = async (e) => { e.preventDefault(); const r = await run(() => api(`/weather?${new URLSearchParams(form)}`), 'Đã tải thời tiết.'); if (r?.data) setWeather(r.data); };
  return (
    <div className="animate-in">
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <form className="form-row" onSubmit={submit}>
          <label style={{ flex: 1 }}>Điểm đến <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></label>
          <label style={{ width: 100 }}>Số ngày <input type="number" value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} /></label>
          <button className="primary icon-text" type="submit" style={{ alignSelf: 'end' }}><UiIcon icon={CloudSun} />Xem thời tiết</button>
        </form>
      </div>
      
      {loading && !weather ? (
        <Skeleton type="card" rows={form.days || 3} />
      ) : (
        weather && weather.forecast && (
          <div className="weather-forecast-grid animate-in">
            {weather.forecast.map((w, idx) => (
              <div className="weather-day-card" key={idx}>
                <div className="weather-day-header">
                  <span className="weather-day-title">{dateText(w.date)} (Ngày {w.day})</span>
                  <span className="weather-day-icon">
                    <WeatherIcon type={w.icon} />
                  </span>
                </div>
                <div className="weather-day-temp">{w.temp}</div>
                <div className="weather-day-desc">{w.statusLabel}</div>
                <div className="weather-day-meta">
                  <span className="icon-text"><UiIcon icon={Umbrella} size={15} />Mưa: {w.rainProbability || '0%'}</span>
                  <span className="icon-text"><UiIcon icon={Navigation} size={15} />Gió: {w.windSpeed || '0 km/h'}</span>
                </div>
                {w.recommendations && w.recommendations.length > 0 && (
                  <div>
                    <div className="weather-recs-title icon-text"><UiIcon icon={Sparkles} size={16} />Điểm vui chơi phù hợp:</div>
                    {w.recommendations.map((rec, rIdx) => (
                      <div className="weather-rec-item" key={rIdx}>
                        <span><UiIcon icon={rec.category === 'FOOD' ? Compass : MapPinned} size={16} /></span>
                        <span>{rec.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED
   ═══════════════════════════════════════════════════════════ */
function SharedPanel({ api, run, sharedTrip, setSharedTrip }) {
  const [code, setCode] = useState('');
  const submit = async (e) => { e.preventDefault(); const r = await run(() => api(`/trips/shared/${encodeURIComponent(code)}`), 'Đã tải chuyến đi.'); if (r?.data) setSharedTrip(r.data); };
  return (
    <div className="animate-in">
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <form className="inline-form" onSubmit={submit} style={{ marginBottom: 0 }}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Nhập share code..." />
          <button className="primary icon-text" type="submit"><UiIcon icon={Link2} />Mở</button>
        </form>
      </div>
      {sharedTrip && <div className="card card-pad"><TripReadOnly trip={sharedTrip} /></div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROFILE
   ═══════════════════════════════════════════════════════════ */
function ProfilePanel({ api, run, user, setUser, token, loadProfile, clearSession }) {
  const paymentOrderStorageKey = 'travelmate.web.payosOrderCode';
  const [lastOrderCode, setLastOrderCode] = useState(() => safeLocalStorage.getItem(paymentOrderStorageKey) || '');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [generatingPayment, setGeneratingPayment] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [payosCheckoutUrl, setPayosCheckoutUrl] = useState('');

  const startPayosPremium = async () => {
    setGeneratingPayment(true);
    setPayosCheckoutUrl('');
    const r = await run(() => api('/payments/payos/premium', { method: 'POST' }), 'Đã tạo link thanh toán PayOS.');
    if (r?.data?.checkoutUrl) {
      const orderCode = String(r.data.orderCode);
      setLastOrderCode(orderCode);
      safeLocalStorage.setItem(paymentOrderStorageKey, orderCode);
      setPayosCheckoutUrl(r.data.checkoutUrl);
      try {
        const opened = window.open(r.data.checkoutUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
          console.warn('Popup blocked, user will click the link manually.');
        }
      } catch (err) {
        console.warn('Auto window.open failed:', err);
      }
    }
    setGeneratingPayment(false);
  };

  const checkPremiumPayment = async ({ silent = false } = {}) => {
    if (!lastOrderCode) return;
    setCheckingPayment(true);
    try {
      const task = () => api(`/payments/payos/${lastOrderCode}`);
      const r = silent ? await task().catch(() => null) : await run(task, 'Da kiem tra thanh toan.');
      if (r?.data?.status === 'PAID') {
        await loadProfile();
        const u = {
          ...user,
          package: r.data.userPackage || 'premium',
          premiumStartedAt: r.data.premiumStartedAt || user?.premiumStartedAt || null,
          premiumExpiresAt: r.data.premiumExpiresAt || user?.premiumExpiresAt || null,
          token,
        };
        setUser(u);
        safeLocalStorage.setItem('travelmate.web.user', JSON.stringify(u));
        safeLocalStorage.removeItem(paymentOrderStorageKey);
        setLastOrderCode('');
        setPayosCheckoutUrl('');
      }
      return r?.data?.status;
    } finally {
      setCheckingPayment(false);
    }
  };

  useEffect(() => {
    const onFocus = () => { checkPremiumPayment({ silent: true }); };
    window.addEventListener('focus', onFocus);
    const query = new URLSearchParams(window.location.search);
    if (query.get('payment') === 'success' || query.get('status') === 'success' || query.get('orderCode')) onFocus();
    return () => window.removeEventListener('focus', onFocus);
  }, [lastOrderCode]);

  return (
    <div className="animate-in">
      <div className="profile-card">
        <div className="profile-avatar">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
        <div className="profile-info">
          <h2>{user?.name || 'Người dùng'}</h2>
          <p>{user?.email}</p>
          <div className="profile-badge">{user?.package || 'free'}</div>
          {user?.package === 'premium' && <p className="muted">Premium đến {premiumExpiryText(user?.premiumExpiresAt)}</p>}
        </div>
      </div>
      <div className="content-grid">
        <div className="card card-pad">
          <h3 className="icon-text" style={{ marginBottom: 14 }}><UiIcon icon={FileText} />Thông tin tài khoản</h3>
          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">Họ và tên</span>
              <span className="detail-value">{user?.name || 'Chưa cập nhật'}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Gói tài khoản</span>
              <span className="detail-value" style={{ textTransform: 'uppercase', fontWeight: 'bold', color: user?.package === 'premium' ? 'var(--warning)' : 'inherit' }}>
                {user?.package || 'free'}
              </span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Vai trò</span>
              <span className="detail-value" style={{ textTransform: 'capitalize' }}>{user?.role || 'user'}</span>
            </div>
          </div>
        </div>
        <div className="card card-pad">
          <h3 className="icon-text" style={{ marginBottom: 14 }}><UiIcon icon={Zap} />Hành động</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            <button className="icon-text" onClick={loadProfile} style={{ width: '100%' }}><UiIcon icon={RotateCcw} />Tải lại hồ sơ</button>
            {user?.package === 'premium' ? (
              <div className="notice success">Tài khoản của bạn đang dùng Premium.</div>
            ) : (
              <button className="primary icon-text" onClick={() => setShowPremiumModal(true)} style={{ width: '100%' }}><UiIcon icon={ShieldCheck} />Mua Premium - 10.000 đ</button>
            )}
            <button onClick={() => checkPremiumPayment()} disabled={!lastOrderCode || checkingPayment} style={{ width: '100%' }}>
              {checkingPayment ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán PayOS'}
            </button>
            {payosCheckoutUrl ? (
              <a className="primary icon-text" href={payosCheckoutUrl} target="_blank" rel="noreferrer" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
                <UiIcon icon={Link2} />Mở lại PayOS
              </a>
            ) : null}
            {lastOrderCode ? <p className="muted">PayOS orderCode: {lastOrderCode}</p> : null}
            <button className="danger icon-text" onClick={clearSession} style={{ width: '100%' }}><UiIcon icon={LogOut} />Đăng xuất</button>
          </div>
        </div>
      </div>
      {showPremiumModal && (
        <div className="premium-modal-backdrop" role="presentation" onMouseDown={() => setShowPremiumModal(false)}>
          <section className="premium-modal" role="dialog" aria-modal="true" aria-labelledby="premium-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="premium-modal-close" onClick={() => setShowPremiumModal(false)} title="Đóng" aria-label="Đóng"><UiIcon icon={X} /></button>
            <div className="premium-modal-icon"><UiIcon icon={ShieldCheck} size={28} strokeWidth={2.2} /></div>
            <p className="premium-modal-kicker">TRAVELMATE PREMIUM</p>
            <h2 id="premium-modal-title">Du lịch chủ động hơn</h2>
            <p className="premium-modal-summary">Gói Premium có hiệu lực 30 ngày kể từ khi PayOS xác nhận thanh toán.</p>
            <div className="premium-benefit-list">
              <div><UiIcon icon={Check} size={18} /><span>Tạo và lưu nhật ký chuyến đi kèm ảnh</span></div>
              <div><UiIcon icon={Check} size={18} /><span>Nhận gợi ý lịch trình được tối ưu hơn</span></div>
              <div><UiIcon icon={Check} size={18} /><span>Truy cập quyền lợi Premium trong 30 ngày</span></div>
            </div>
            <div className="premium-modal-price"><strong>10.000 đ</strong><span>/ 30 ngày</span></div>
            <div className="premium-modal-actions">
              {generatingPayment ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '10px 0' }}>
                  <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Đang tạo liên kết thanh toán PayOS...</p>
                </div>
              ) : payosCheckoutUrl ? (
                <div style={{ display: 'grid', gap: 10, width: '100%' }}>
                  <div className="notice success" style={{ fontSize: 13, padding: '8px 12px', margin: '0 0 10px 0' }}>
                    🎉 Liên kết thanh toán đã sẵn sàng!
                  </div>
                  <a className="primary icon-text" href={payosCheckoutUrl} target="_blank" rel="noreferrer" onClick={() => setShowPremiumModal(false)} style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 'bold' }}>
                    <UiIcon icon={WalletCards} /> Thanh toán qua PayOS
                  </a>
                  <button onClick={() => setShowPremiumModal(false)}>Để sau</button>
                </div>
              ) : (
                <>
                  <button onClick={() => setShowPremiumModal(false)}>Để sau</button>
                  <button className="primary icon-text" onClick={startPayosPremium}><UiIcon icon={WalletCards} />Tiếp tục thanh toán</button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADMIN
   ═══════════════════════════════════════════════════════════ */
const adminStatCards = [
  { key: 'totalUsers', label: 'Tổng người dùng', icon: UsersRound },
  { key: 'premiumUsers', label: 'Người dùng Premium', icon: ShieldCheck },
  { key: 'newTrips', label: 'Chuyến đi mới', icon: Plane },
  { key: 'urgentReports', label: 'Báo cáo cần xử lý', icon: Flag },
  { key: 'pendingCount', label: 'Bài chờ duyệt', icon: FileText },
  { key: 'approvedCount', label: 'Bài đã duyệt', icon: Check },
  { key: 'reportedCount', label: 'Bài bị báo cáo', icon: Flag },
];

function adminPostStatusText(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'Đã duyệt';
  if (normalized === 'rejected') return 'Từ chối';
  if (normalized === 'needs_review' || normalized === 'pending') return 'Chờ duyệt';
  return status || 'Chưa rõ';
}

function AdminStatsOverview({ data }) {
  const growth = Array.isArray(data?.userGrowth) ? data.userGrowth : [];
  const recentPending = Array.isArray(data?.recentPending) ? data.recentPending : [];

  return (
    <div className="admin-stats-panel">
      <h3 className="icon-text"><UiIcon icon={ChartNoAxesCombined} />Thống kê quản trị</h3>
      <div className="stats-grid admin-stats-grid">
        {adminStatCards.map(({ key, label, icon: Icon }) => (
          <div className="stat-card admin-stat-card" key={key}>
            <div className="admin-stat-icon"><UiIcon icon={Icon} /></div>
            <div>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{data?.[key] ?? 0}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-stats-detail-grid">
        <section className="admin-stats-section">
          <h4>Tăng trưởng người dùng</h4>
          {growth.length ? (
            <div className="admin-growth-list">
              {growth.map((item, index) => (
                <div className="admin-growth-item" key={`${item.label || 'growth'}-${index}`}>
                  <span>{item.label || `Mốc ${index + 1}`}</span>
                  <strong>{item.value ?? 0}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Chưa có dữ liệu tăng trưởng.</p>
          )}
        </section>

        <section className="admin-stats-section">
          <h4>Bài chờ duyệt gần đây</h4>
          {recentPending.length ? (
            <div className="admin-pending-list">
              {recentPending.map((post, index) => (
                <article className="admin-pending-item" key={post._id || `${post.title || 'post'}-${index}`}>
                  <div className="admin-pending-head">
                    <strong>{post.title || 'Bài viết chưa có tiêu đề'}</strong>
                    <span className={`status-pill ${post.status === 'rejected' ? 'status-pill-danger' : ''}`}>
                      {adminPostStatusText(post.status)}
                    </span>
                  </div>
                  <p>{post.excerpt || post.content || 'Chưa có nội dung tóm tắt.'}</p>
                  <small>
                    {post.author?.name || 'Ẩn danh'}
                    {post.author?.email ? ` · ${post.author.email}` : ''}
                    {post.createdAt ? ` · ${dateText(post.createdAt)}` : ''}
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">Không có bài viết chờ duyệt gần đây.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function AdminPanel({ api, run, adminData, setAdminData }) {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const loadStats = async () => { const r = await run(() => api('/admin/stats'), 'Đã tải stats.'); if (r?.data) setAdminData(r.data); };
  const loadUsers = async () => { const r = await run(() => api('/admin/users?page=1&limit=20'), 'Đã tải users.'); if (r?.data) setUsers(r.data.users || r.data || []); };
  const loadPosts = async () => { const r = await run(() => api('/admin/posts?tab=pending&page=1'), 'Đã tải bài chờ duyệt.'); if (r?.data) setPosts(r.data.posts || r.data || []); };
  const updateUser = async (user, field, value) => {
    const r = await run(() => api(`/admin/users/${user._id}/${field}`, { method: 'PUT', body: JSON.stringify({ [field === 'package' ? 'package' : field]: value }) }), 'Đã cập nhật người dùng.');
    if (r) loadUsers();
  };
  const moderate = async (post, action) => {
    const r = await run(() => api(`/admin/posts/${post._id}/moderate`, { method: 'POST', body: JSON.stringify({ action }) }), 'Đã kiểm duyệt bài viết.');
    if (r) loadPosts();
  };
  return (
    <div className="animate-in">
      <div className="button-row" style={{ marginBottom: 24 }}>
        <button className="icon-text" onClick={loadStats}><UiIcon icon={ChartNoAxesCombined} />Thống kê</button>
        <button className="icon-text" onClick={loadUsers}><UiIcon icon={UsersRound} />Người dùng</button>
        <button className="icon-text" onClick={loadPosts}><UiIcon icon={FileText} />Bài chờ duyệt</button>
      </div>
      {adminData && <div className="card card-pad" style={{ marginBottom: 24 }}><AdminStatsOverview data={adminData} /></div>}
      <div className="content-grid">
        <div>
          <ResultList title="Users" items={users} render={(u) => (<><div className="item-icon" style={{ background: 'rgba(139,92,246,0.1)' }}><UiIcon icon={CircleUserRound} /></div><div style={{ flex: 1 }}><h3>{u.name || u.email}</h3><p>{u.email}</p><small>{u.role} · {u.package} · {u.status}</small></div><div className="button-column"><button onClick={() => updateUser(u, 'package', u.package === 'premium' ? 'free' : 'premium')}>{u.package === 'premium' ? 'Hạ Premium' : 'Nâng Premium'}</button><button onClick={() => updateUser(u, 'status', u.status === 'suspended' ? 'active' : 'suspended')}>{u.status === 'suspended' ? 'Mở khóa' : 'Khóa'}</button><button onClick={() => updateUser(u, 'role', u.role === 'moderator' ? 'user' : 'moderator')}>{u.role === 'moderator' ? 'Gỡ moderator' : 'Đặt moderator'}</button></div></>)} />
        </div>
        <div><ResultList title="Bài viết chờ duyệt" items={posts} empty="Không có bài viết chờ duyệt." render={(post) => (<><div className="item-icon" style={{ background: 'rgba(245,158,11,0.1)' }}><UiIcon icon={FileText} /></div><div style={{ flex: 1 }}><h3>{post.title}</h3><p>{post.content}</p><small>{post.author?.name || 'Ẩn danh'} · {post.status}</small></div><div className="button-column"><button className="primary" onClick={() => moderate(post, 'approve')}>Duyệt</button><button className="danger" onClick={() => moderate(post, 'reject')}>Từ chối</button><button onClick={() => moderate(post, 'clear_report')}>Bỏ báo cáo</button></div></>)} /></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════ */
function TextInput({ label, value, onChange, type = 'text' }) {
  return <label>{label}<input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}
function TripSelect({ trips, value, onChange }) {
  return <label>Chọn chuyến đi<select value={value} onChange={(e) => onChange(e.target.value)}><option value="">-- chọn --</option>{trips.map(t => <option key={t._id} value={t._id}>{t.destination} · {dateText(t.startDate)}</option>)}</select></label>;
}
const travelStylesList = [
  { value: 'FOOD', label: 'Ẩm thực (Food)' },
  { value: 'NATURE', label: 'Thiên nhiên (Nature)' },
  { value: 'BEACH', label: 'Biển (Beach)' },
  { value: 'HISTORICAL', label: 'Lịch sử (Historical)' },
  { value: 'ADVENTURE', label: 'Phiêu lưu (Adventure)' },
  { value: 'PHOTOGRAPHY', label: 'Chụp ảnh (Photography)' },
  { value: 'SHOPPING', label: 'Mua sắm (Shopping)' },
  { value: 'NIGHTLIFE', label: 'Giải trí đêm (Nightlife)' },
];

const interestOptions = [
  { value: 'Ăn uống', label: 'Ăn uống' },
  { value: 'Thiên nhiên', label: 'Thiên nhiên' },
  { value: 'Văn hóa', label: 'Văn hóa' },
  { value: 'Biển', label: 'Biển' },
  { value: 'Phiêu lưu', label: 'Phiêu lưu' },
  { value: 'Chụp ảnh', label: 'Chụp ảnh' },
  { value: 'Mua sắm', label: 'Mua sắm' },
  { value: 'Thư giãn', label: '☀️ Thư giãn' },
];

const tripTypesList = [
  { value: 'Solo', label: 'Một mình (Solo)' },
  { value: 'Couple', label: 'Cặp đôi (Couple)' },
  { value: 'Family', label: 'Gia đình (Family)' },
  { value: 'Friends', label: 'Bạn bè (Friends)' },
  { value: 'Business', label: 'Công việc (Business)' },
];

function TripForm({ form, setForm, onSubmit, submitText }) {
  return (
    <form className="form-grid form-grid-3" onSubmit={onSubmit}>
      <TextInput label="Điểm đến" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} />
      <TextInput label="Ngày đi" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
      <TextInput label="Ngày về" type="date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
      <TextInput label="Số người" type="number" value={form.people} onChange={(v) => setForm({ ...form, people: Number(v) })} />
      <TextInput label="Ngân sách" type="number" value={form.budget} onChange={(v) => setForm({ ...form, budget: Number(v) })} />
      <TextInput label="Khu khách sạn" value={form.hotelArea} onChange={(v) => setForm({ ...form, hotelArea: v })} />
      
      <div className="full">
        <label>Phong cách du lịch</label>
        <div className="chips-container">
          {travelStylesList.map(item => {
            const activeStyles = form.travelStyle ? form.travelStyle.split(',').map(s => s.trim()) : [];
            const isActive = activeStyles.includes(item.value);
            const toggle = () => {
              const next = isActive 
                ? activeStyles.filter(x => x !== item.value)
                : [...activeStyles, item.value];
              setForm({ ...form, travelStyle: next.join(', ') });
            };
            return (
              <button type="button" key={item.value} className={`chip-btn ${isActive ? 'active' : ''}`} onClick={toggle}>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="full">
        <label>Sở thích du lịch</label>
        <div className="chips-container">
          {interestOptions.map(item => {
            const activeInterests = form.interests ? form.interests.split(',').map(s => s.trim()) : [];
            const isActive = activeInterests.includes(item.value);
            const toggle = () => {
              const next = isActive 
                ? activeInterests.filter(x => x !== item.value)
                : [...activeInterests, item.value];
              setForm({ ...form, interests: next.join(', ') });
            };
            return (
              <button type="button" key={item.value} className={`chip-btn ${isActive ? 'active' : ''}`} onClick={toggle}>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="full">
        <label>Loại chuyến đi</label>
        <div className="chips-container">
          {tripTypesList.map(item => {
            const isActive = form.tripType === item.value;
            const select = () => setForm({ ...form, tripType: item.value });
            return (
              <button type="button" key={item.value} className={`chip-btn ${isActive ? 'active' : ''}`} onClick={select}>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="full"><label className="checkbox-row"><input type="checkbox" checked={form.generateAiItinerary} onChange={(e) => setForm({ ...form, generateAiItinerary: e.target.checked })} /> Tạo lịch trình tự động bằng AI</label></div>
      <div className="full"><button className="primary" type="submit" style={{ width: '100%', padding: 14, fontSize: 15 }}>{submitText}</button></div>
    </form>
  );
}
function ResultList({ title, items = [], empty = 'Không có dữ liệu.', render }) {
  return (
    <div className="list-block">
      {title && <h3 style={{ marginBottom: 12 }}>{title}</h3>}
      {!items.length ? <div className="empty-state" style={{ padding: '28px 16px' }}><div className="empty-state-text">{empty}</div></div> : (
        <div className="list">{items.map((item, i) => <article className="item" key={item._id || item.id || item.name || item.title || i}>{render(item, i)}</article>)}</div>
      )}
    </div>
  );
}
const keyLabels = {
  // Budget
  accommodation: 'Nơi ở (Accommodation)',
  food: 'Ăn uống (Food & Beverage)',
  foodAndBeverage: 'Ăn uống (Food & Beverage)',
  transportation: 'Di chuyển (Transportation)',
  transport: 'Di chuyển (Transportation)',
  activitiesAndEntranceFees: 'Vui chơi & Vé tham quan',
  activities: 'Vui chơi & Vé tham quan',
  unforeseenExpenses: 'Chi phí phát sinh',
  other: 'Chi phí phát sinh',
  amount: 'Số tiền',
  percent: 'Tỷ lệ',
  totalExpenses: 'Tổng chi phí dự kiến',
  remainingBudget: 'Ngân sách còn lại',
  totalEstimatedCost: 'Tổng chi phí dự kiến',
  
  // Hotel
  name: 'Tên gợi ý',
  address: 'Địa chỉ',
  area: 'Khu vực',
  estimatedCostPerNight: 'Giá phòng/đêm dự kiến',
  pricePerNight: 'Giá phòng/đêm dự kiến',
  estimatedTotalPrice: 'Tổng tiền phòng dự kiến',
  rating: 'Đánh giá',
  description: 'Mô tả',
  note: 'Ghi chú',
  cuisineType: 'Loại món ăn',
  averagePricePerPerson: 'Giá trung bình/người',
  nearByPlace: 'Gần địa điểm',
  
  // User profile
  email: 'Email',
  role: 'Vai trò',
  package: 'Gói tài khoản',
};

function InfoBox({ title, icon: Icon, data, fallback = 'Không có dữ liệu.', formatter }) {
  const heading = title && <h3 className={Icon ? 'icon-text' : ''}>{Icon && <UiIcon icon={Icon} />}{title}</h3>;
  if (!data) return <div className="info-box">{heading}<p className="muted">{fallback}</p></div>;
  const filteredEntries = Object.entries(data).filter(([k]) => !['token', 'password', '_id', '__v', 'id', 'id_token', 'clientSecret', 'apiKey', 'tripId'].includes(k));
  return (
    <div className="info-box">
      {heading}
      {filteredEntries.length === 0 ? (
        <p className="muted">{fallback}</p>
      ) : (
        <dl>
          {filteredEntries.map(([k, v]) => (
            <React.Fragment key={k}>
              <dt>{keyLabels[k] || k}</dt>
              <dd>{typeof v === 'number' && formatter ? formatter(v) : stringify(v)}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
    </div>
  );
}
function PostList({ posts = [], quickAction }) {
  const [commentDrafts, setCommentDrafts] = useState({});
  if (!posts.length) return <div className="empty-state" style={{ padding: 20 }}><div className="empty-state-text">Chưa có bài viết.</div></div>;
  return <div>{posts.map(p => (
    <div className="post-card-full" key={p._id || p.title}>
      <div className="community-post-header">
        <div className="community-author-avatar">{(p.author?.name || p.authorName || 'T').charAt(0).toUpperCase()}</div>
        <div><strong>{p.author?.name || p.authorName || 'TravelMate'}</strong><small>{p.category || 'Du lịch'} · {p.readTime || '5 phút đọc'}</small></div>
      </div>
      <h3>{p.title}</h3>
      {p.status && p.status !== 'approved' && (
        <span className={`status-pill ${p.status === 'rejected' ? 'status-pill-danger' : ''}`}>
          {p.status === 'pending' ? 'Đang chờ duyệt' : 'Bị từ chối'}
        </span>
      )}
      {p.imageUrl && <img className="community-post-image" src={p.imageUrl} alt={p.title} loading="lazy" />}
      <p>{p.content || p.excerpt}</p>
      <div className="community-post-stats"><span>{p.likesCount || 0} lượt thích</span><span>{p.commentsCount || (p.comments || []).length} bình luận</span><span>{p.sharesCount || p.shares || 0} lượt chia sẻ</span></div>
      {quickAction && <div className="post-actions">
        <button className="post-action-btn icon-text" onClick={() => quickAction(`/posts/${p._id}/like`, 'Đã like.')}><UiIcon icon={ThumbsUp} size={15} />Thích</button>
        <button className="post-action-btn icon-text" onClick={() => quickAction(`/posts/${p._id}/share`, 'Đã share.')}><UiIcon icon={Link2} size={15} />Chia sẻ</button>
        <button className="post-action-btn icon-text" onClick={() => quickAction(`/posts/${p._id}/report`, 'Đã report.')}><UiIcon icon={Flag} size={15} />Báo cáo</button>
        {(p.author?._id || p.authorId) && <button className="post-action-btn icon-text" onClick={() => quickAction(`/posts/authors/${p.author?._id || p.authorId}/follow`, 'Đã cập nhật theo dõi tác giả.')}><UiIcon icon={UserPlus} size={15} />Theo dõi</button>}
      </div>}
      {quickAction && <form className="inline-form" onSubmit={(event) => {
        event.preventDefault();
        const content = String(commentDrafts[p._id] || '').trim();
        if (!content) return;
        quickAction(`/posts/${p._id}/comments`, 'Đã thêm bình luận.', { content });
        setCommentDrafts((items) => ({ ...items, [p._id]: '' }));
      }} style={{ marginTop: 12 }}>
        <input value={commentDrafts[p._id] || ''} onChange={(event) => setCommentDrafts((items) => ({ ...items, [p._id]: event.target.value }))} placeholder="Viết bình luận..." />
        <button type="submit">Gửi</button>
      </form>}
      {(p.comments || []).length > 0 && <div className="post-comments">{p.comments.map((comment, index) => <p key={comment._id || index}><strong>{comment.author?.name || comment.authorName || 'Người dùng'}:</strong> {comment.content}</p>)}</div>}
    </div>
  ))}</div>;
}
function PreviewResult({ preview }) {
  return (
    <div>
      <h3 className="icon-text" style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}><UiIcon icon={Sparkles} />Kết quả preview</h3>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Điểm đến</div><div className="stat-value" style={{ fontSize: 18 }}>{preview.destination}</div></div>
        <div className="stat-card"><div className="stat-label">Số người</div><div className="stat-value">{preview.people}</div></div>
        <div className="stat-card"><div className="stat-label">Tổng dự kiến</div><div className="stat-value" style={{ fontSize: 16, color: 'var(--primary)' }}>{money(preview.estimatedTotalCost)}</div></div>
      </div>
      {preview.budgetMessage && <p className="muted" style={{ margin: '12px 0' }}>{preview.budgetMessage}</p>}
      {(preview.days || []).map(day => (
        <div className="timeline-day" key={day.day}>
          <h3 className="timeline-day-title">{day.title || `Ngày ${day.day}`} · {dateText(day.date)}</h3>
          {(day.activities || []).map((a, i) => (
            <div className="activity-card" key={`${day.day}-${i}`}>
              <div className="activity-line"><div className="activity-dot" /><div className="activity-connector" /></div>
              <div className="activity-body">
                <div className="activity-time">{a.timeSlot}</div>
                <div className="activity-location">{a.place}</div>
                {a.address && <div className="activity-desc">{a.address}</div>}
                <div className="activity-tags">
                  {a.activityType && <span className="activity-tag">{a.activityType}</span>}
                  {a.suggestedTransport && <span className="activity-tag"><UiIcon icon={Car} size={14} />{a.suggestedTransport}</span>}
                  {a.estimatedCost > 0 && <span className="activity-tag" style={{ color: 'var(--primary)', background: 'var(--primary-50)' }}>{money(a.estimatedCost)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
function TripReadOnly({ trip }) {
  const days = groupByDay(trip.activities || []);
  return (
    <div>
      <h3 className="icon-text" style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}><UiIcon icon={MapPinned} />{trip.destination}</h3>
      <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>{dateText(trip.startDate)} - {dateText(trip.endDate)}</p>
      {Object.entries(days).map(([day, acts]) => (
        <div className="timeline-day" key={day}>
          <h3 className="timeline-day-title">Ngày {day}</h3>
          {acts.map((a, i) => (
            <div className="activity-card" key={a._id || i}>
              <div className="activity-line"><div className="activity-dot" /><div className="activity-connector" /></div>
              <div className="activity-body">
                <div className="activity-time">{a.time}</div>
                <div className="activity-location">{a.location}</div>
                {a.description && <div className="activity-desc">{a.description}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
