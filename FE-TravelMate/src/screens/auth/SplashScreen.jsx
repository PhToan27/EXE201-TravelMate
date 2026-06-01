import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Scenic Header Image */}
      <View style={styles.heroWrap}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800' }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Logo overlay on top left of image */}
        <View style={[styles.logoOverlay, { top: insets.top + SPACING.sm }]}>
          <View style={styles.logoBadge}>
            <Ionicons name="globe-outline" size={14} color={COLORS.white} />
            <Text style={styles.logoBadgeText}>TravelMate</Text>
          </View>
        </View>
      </View>

      {/* Bottom Content Card */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + SPACING.sm,
          },
        ]}
      >
        {/* Orange Map Icon */}
        <View style={styles.mapIconWrap}>
          <Ionicons name="map-outline" size={24} color={COLORS.primary} />
        </View>

        {/* Title */}
        <Text style={styles.welcomeText}>Chào mừng bạn đến với</Text>
        <Text style={styles.appName}>TravelMate</Text>

        <Text style={styles.tagline}>
          Kế hoạch thông minh, hành trình trọn vẹn
        </Text>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.9}
        >
          <Text style={styles.startText}>Bắt đầu ngay</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.loginText}>Đăng nhập</Text>
        </TouchableOpacity>

        {/* Bottom Nav Placeholder Tabs */}
        <View style={styles.bottomBar}>
          <BottomTab icon="sparkles" label="AI GỢI Ý" />
          <BottomTab icon="calendar-outline" label="LỊCH TRÌNH" />
          <BottomTab icon="wallet-outline" label="TIẾT KIỆM" />
        </View>
      </Animated.View>
    </View>
  );
};

const BottomTab = ({ icon, label }) => (
  <View style={tabStyles.tab}>
    <Ionicons name={icon} size={20} color={COLORS.gray[400]} />
    <Text style={tabStyles.label}>{label}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  tab: { alignItems: 'center', gap: 4, flex: 1 },
  label: { fontSize: 9, color: COLORS.gray[500], fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  heroWrap: {
    height: height * 0.52,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  logoOverlay: {
    position: 'absolute',
    left: SPACING.md,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoBadgeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    alignItems: 'center',
  },
  mapIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  startBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  loginBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray[700],
  },
  bottomBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: SPACING.md,
    marginTop: 'auto',
  },
});

export default SplashScreen;
