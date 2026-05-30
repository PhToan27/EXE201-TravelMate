import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Hero image placeholder with gradient */}
      <View style={styles.heroWrap}>
        <LinearGradient
          colors={['#E0F2FE', '#BAE6FD', '#7DD3FC']}
          style={styles.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative circles */}
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />

          {/* Airplane icon */}
          <Animated.View style={[styles.airplaneWrap, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.airplaneBg}>
              <Ionicons name="airplane" size={56} color={COLORS.primary} />
            </View>
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Bottom content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="map" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.logoText}>
            Travel<Text style={styles.logoHighlight}>Mate</Text>
          </Text>
        </View>

        <Text style={styles.tagline}>
          Kế hoạch thông minh,{'\n'}hành trình trọn vẹn
        </Text>

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#F97316', '#EA6C0A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startGradient}
          >
            <Text style={styles.startText}>Bắt đầu ngay</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.loginText}>Đăng nhập</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom nav placeholder bar */}
      <View style={styles.bottomBar}>
        <BottomTab icon="person-outline" label="AI GỢI Ý" />
        <BottomTab icon="calendar-outline" label="LỊCH TRÌNH" />
        <BottomTab icon="save-outline" label="TIẾT KIỆM" />
      </View>
    </View>
  );
};

const BottomTab = ({ icon, label }) => (
  <View style={tabStyles.tab}>
    <Ionicons name={icon} size={20} color={COLORS.gray[500]} />
    <Text style={tabStyles.label}>{label}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  tab: { alignItems: 'center', gap: 3 },
  label: { fontSize: 9, color: COLORS.gray[500], fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  heroWrap: {
    height: height * 0.5,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  circle1: { width: 300, height: 300, top: -80, right: -80 },
  circle2: { width: 200, height: 200, bottom: -40, left: -40 },
  circle3: { width: 120, height: 120, top: 80, left: 40 },
  airplaneWrap: {
    alignItems: 'center',
  },
  airplaneBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.black,
  },
  logoHighlight: {
    color: COLORS.primary,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  startBtn: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 16,
  },
  startText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  loginBtn: {
    paddingVertical: 12,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingBottom: SPACING.lg,
  },
});

export default SplashScreen;
