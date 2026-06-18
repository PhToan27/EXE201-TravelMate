import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/common/Header';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { getWeather } from '../../services/weather/weatherApi';

const WeatherScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { destination, days = 3, tripId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const res = await getWeather(destination, days);
        if (res.success) {
          setWeatherData(res.data);
        }
      } catch (err) {
        console.error('Error loading weather data:', err);
        Alert.alert('Lỗi', 'Không thể tải thông tin thời tiết. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (destination) {
      fetchWeather();
    } else {
      setLoading(false);
    }
  }, [destination, days]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải dự báo thời tiết...</Text>
      </View>
    );
  }

  if (!weatherData || !weatherData.forecast || weatherData.forecast.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.gray[400]} />
        <Text style={styles.errorText}>Không có dữ liệu thời tiết cho {destination}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const forecast = weatherData.forecast;
  const currentDay = forecast[selectedDayIdx] || forecast[0];
  const isRainy = currentDay.isRainy;

  // Weather Gradient based on state
  const bgGradients = {
    Rainy: ['#475569', '#1e293b'],
    Stormy: ['#334155', '#0f172a'],
    Sunny: ['#3B82F6', '#06B6D4'],
    Cloudy: ['#64748B', '#334155'],
    PartlySunny: ['#60A5FA', '#3B82F6']
  };

  const currentGradient = bgGradients[currentDay.status] || bgGradients.Sunny;

  return (
    <View style={styles.container}>
      <Header
        title="Dự báo thời tiết"
        subtitle={destination}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Weather Card */}
        <LinearGradient
          colors={currentGradient}
          style={styles.mainCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.mainCardHeader}>
            <View>
              <Text style={styles.mainCardDate}>Ngày {currentDay.day} - {currentDay.date}</Text>
              <Text style={styles.mainCardLabel}>{currentDay.statusLabel}</Text>
            </View>
            <Ionicons name={currentDay.icon || 'sunny-outline'} size={48} color={COLORS.white} />
          </View>

          <Text style={styles.mainCardTemp}>{currentDay.temp}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="rainy-outline" size={16} color={COLORS.white} />
              <View>
                <Text style={styles.statLabel}>XÁC SUẤT MƯA</Text>
                <Text style={styles.statVal}>{currentDay.rainProbability}</Text>
              </View>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="leaf-outline" size={16} color={COLORS.white} />
              <View>
                <Text style={styles.statLabel}>TỐC ĐỘ GIÓ</Text>
                <Text style={styles.statVal}>{currentDay.windSpeed}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* 3-Day Forecast Grid */}
        <Text style={styles.sectionTitle}>Dự báo các ngày tiếp theo</Text>
        <View style={styles.forecastList}>
          {forecast.map((day, idx) => {
            const active = selectedDayIdx === idx;
            return (
              <TouchableOpacity
                key={day.day}
                style={[styles.forecastItem, active && styles.forecastItemActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedDayIdx(idx)}
              >
                <Text style={[styles.forecastDay, active && styles.forecastDayActive]}>N{day.day}</Text>
                <Ionicons
                  name={day.icon}
                  size={20}
                  color={active ? COLORS.primary : COLORS.gray[500]}
                />
                <Text style={[styles.forecastTemp, active && styles.forecastTempActive]}>{day.temp}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AI Weather Assistant Suggestion Card */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBg}>
              <Ionicons name="sparkles" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.aiTitle}>Trợ lý Thời tiết AI</Text>
          </View>

          <Text style={styles.aiPrompt}>
            {isRainy
              ? `🌧️ Trời hôm nay có mưa lớn (${currentDay.rainProbability}). TravelMate khuyên bạn nên tham gia các hoạt động trong nhà sau để hành trình luôn trọn vẹn:`
              : `☀️ Thời tiết hôm nay rất đẹp (${currentDay.statusLabel}). Đây là thời điểm lý tưởng để tham quan các địa điểm ngoài trời nổi bật:`}
          </Text>

          <View style={styles.placesList}>
            {currentDay.recommendations && currentDay.recommendations.length > 0 ? (
              currentDay.recommendations.map((place) => (
                <TouchableOpacity
                  key={place._id}
                  style={styles.placeItem}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('PlaceDetail', { placeName: place.name, tripId })}
                >
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeAddress} numberOfLines={1}>
                      {place.address}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingText}>{place.rating || '4.5'}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>Đang tải địa điểm phù hợp...</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, gap: SPACING.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.gray[500], fontWeight: '500' },
  errorText: { marginTop: 12, fontSize: 14, color: COLORS.gray[500], textAlign: 'center' },
  backBtn: { marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.md },
  backBtnText: { color: COLORS.white, fontWeight: '700' },
  mainCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  mainCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mainCardDate: { fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', fontWeight: '700', textTransform: 'uppercase' },
  mainCardLabel: { fontSize: 18, color: COLORS.white, fontWeight: '800', marginTop: 4 },
  mainCardTemp: { fontSize: 56, color: COLORS.white, fontWeight: '900', marginVertical: 8 },
  statsRow: { flexDirection: 'row', gap: SPACING.lg, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)', paddingTop: 12 },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { fontSize: 8, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '800', letterSpacing: 0.5 },
  statVal: { fontSize: 13, color: COLORS.white, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.black, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  forecastList: { flexDirection: 'row', gap: 10 },
  forecastItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  forecastItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF7ED',
  },
  forecastDay: { fontSize: 11, fontWeight: '700', color: COLORS.gray[500] },
  forecastDayActive: { color: COLORS.primary },
  forecastTemp: { fontSize: 13, fontWeight: '800', color: COLORS.black },
  forecastTempActive: { color: COLORS.primary },
  aiCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTitle: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  aiPrompt: { fontSize: 13, color: COLORS.gray[600], lineHeight: 18, marginBottom: 12 },
  placesList: { gap: 8 },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    padding: 10,
  },
  placeInfo: { flex: 1, minWidth: 0, gap: 2 },
  placeName: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  placeAddress: { fontSize: 11, color: COLORS.gray[400] },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, fontWeight: '600', color: COLORS.gray[600] },
});

export default WeatherScreen;
