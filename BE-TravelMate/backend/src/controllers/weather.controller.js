const Place = require('../models/Place');

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

/**
 * @desc    Get weather forecast and smart indoor/outdoor place recommendations
 * @route   GET /api/weather
 * @access  Private
 */
const getWeatherForecast = async (req, res) => {
  try {
    const { destination, days = 3 } = req.query;

    if (!destination) {
      return res.status(400).json({ success: false, message: 'Please provide destination' });
    }

    const durationDays = Math.max(1, Math.min(Number(days), 7));
    const destNormalized = normalizeText(destination);

    // Fetch places from database to filter for recommendations
    const allPlaces = await Place.find({}).lean();
    const destinationPlaces = allPlaces.filter(p => {
      const text = normalizeText(`${p.name || ''} ${p.address || ''} ${p.category || ''}`);
      return text.includes(destNormalized) || destNormalized.includes(normalizeText(p.name));
    });

    const sourcePlaces = destinationPlaces.length ? destinationPlaces : allPlaces;

    // Categorize places into indoor and outdoor
    const indoorKeywords = ['bao tang', 'cafe', 'ca phe', 'nha hang', 'chua', 'trung tam thuong mai', 'mua sam', 'am thuc', 'an uong', 'cinema', 'rap chieu phim'];
    const outdoorKeywords = ['bien', 'bai tam', 'dao', 'nui', 'deo', 'suoi', 'thac', 'phuot', 'checkin', 'ngoai troi', 'cong vien', 'park', 'ban dao'];

    const indoorPlaces = sourcePlaces.filter(p => {
      const text = normalizeText(`${p.name || ''} ${p.category || ''} ${p.introduction || ''}`);
      return p.category === 'FOOD' || p.category === 'SHOPPING' || indoorKeywords.some(kw => text.includes(kw));
    }).slice(0, 4);

    const outdoorPlaces = sourcePlaces.filter(p => {
      const text = normalizeText(`${p.name || ''} ${p.category || ''} ${p.introduction || ''}`);
      return p.category === 'PLACE' && outdoorKeywords.some(kw => text.includes(kw));
    }).slice(0, 4);

    // Map WMO Weatherinterpretation codes (WW) to app statuses and icons
    const mapWmoToWeatherState = (code) => {
      if ([0].includes(code)) {
        return { status: 'Sunny', label: 'Trời nắng ráo', icon: 'sunny-outline', isRainy: false };
      }
      if ([1, 2, 3].includes(code)) {
        return { status: 'PartlySunny', label: 'Nắng nhẹ, ít mây', icon: 'partly-sunny-outline', isRainy: false };
      }
      if ([45, 48].includes(code)) {
        return { status: 'Cloudy', label: 'Có sương mù', icon: 'cloudy-outline', isRainy: false };
      }
      if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 85, 86].includes(code)) {
        return { status: 'Rainy', label: 'Có mưa rào', icon: 'rainy-outline', isRainy: true };
      }
      if ([95, 96, 99].includes(code)) {
        return { status: 'Stormy', label: 'Có dông bão', icon: 'thunderstorm-outline', isRainy: true };
      }
      return { status: 'Cloudy', label: 'Nhiều mây', icon: 'cloudy-outline', isRainy: false };
    };

    let forecast = [];

    try {
      // 1. Convert destination name to coordinates using Open-Meteo Geocoding API
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      let latitude = 16.0678; // Default to Da Nang coordinates
      let longitude = 108.2208;

      if (geoData && geoData.results && geoData.results.length > 0) {
        latitude = geoData.results[0].latitude;
        longitude = geoData.results[0].longitude;
      }

      // 2. Fetch forecast data from Open-Meteo Forecast API
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weather_code&timezone=Asia/Ho_Chi_Minh&forecast_days=${durationDays}`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      if (weatherData && weatherData.daily) {
        const daily = weatherData.daily;
        const daysToLoop = Math.min(durationDays, daily.time.length);
        for (let idx = 0; idx < daysToLoop; idx++) {
          const code = daily.weather_code[idx];
          const weatherState = mapWmoToWeatherState(code);

          const maxTemp = Math.round(daily.temperature_2m_max[idx]);
          const minTemp = Math.round(daily.temperature_2m_min[idx]);
          const avgTemp = Math.round((maxTemp + minTemp) / 2);

          const rainProb = daily.precipitation_probability_max[idx] ?? 0;
          const windSpeed = daily.wind_speed_10m_max[idx] ?? 0;

          forecast.push({
            day: idx + 1,
            date: daily.time[idx],
            temp: `${avgTemp}°C`,
            rainProbability: `${rainProb}%`,
            windSpeed: `${windSpeed} km/h`,
            statusLabel: weatherState.label,
            status: weatherState.status,
            icon: weatherState.icon,
            isRainy: weatherState.isRainy,
            recommendations: weatherState.isRainy ? indoorPlaces : outdoorPlaces
          });
        }
      }
    } catch (apiError) {
      console.warn('Real weather API failed, falling back to simulated weather:', apiError);
    }

    // Fallback: If forecast is still empty due to API error or network issue
    if (forecast.length === 0) {
      const weatherStatesFallback = [
        { status: 'Rainy', label: 'Có mưa rào (Mô phỏng)', temp: '24°C', rainProb: '85%', wind: '14 km/h', icon: 'rainy-outline' },
        { status: 'Sunny', label: 'Nắng ráo (Mô phỏng)', temp: '32°C', rainProb: '10%', wind: '8 km/h', icon: 'sunny-outline' },
        { status: 'Cloudy', label: 'Nhiều mây (Mô phỏng)', temp: '28°C', rainProb: '40%', wind: '10 km/h', icon: 'cloudy-outline' },
        { status: 'Stormy', label: 'Mưa dông (Mô phỏng)', temp: '23°C', rainProb: '90%', wind: '22 km/h', icon: 'thunderstorm-outline' },
        { status: 'PartlySunny', label: 'Nắng nhẹ (Mô phỏng)', temp: '30°C', rainProb: '25%', wind: '9 km/h', icon: 'partly-sunny-outline' }
      ];

      forecast = Array.from({ length: durationDays }, (_, idx) => {
        const state = weatherStatesFallback[idx % weatherStatesFallback.length];
        const isRainy = state.status === 'Rainy' || state.status === 'Stormy';

        return {
          day: idx + 1,
          date: new Date(Date.now() + idx * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          temp: state.temp,
          rainProbability: state.rainProb,
          windSpeed: state.wind,
          statusLabel: state.label,
          status: state.status,
          icon: state.icon,
          isRainy,
          recommendations: isRainy ? indoorPlaces : outdoorPlaces
        };
      });
    }

    return res.json({
      success: true,
      data: {
        destination,
        forecast
      }
    });
  } catch (error) {
    console.error('Weather forecast API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getWeatherForecast,
};
