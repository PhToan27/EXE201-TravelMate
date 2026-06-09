import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import useAuth from '../../hooks/useAuth';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';


// Cho phép Expo đóng WebBrowser sau khi OAuth xong
WebBrowser.maybeCompleteAuthSession();

// Google OAuth discovery endpoints
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [googleLoading, setGoogleLoading] = useState(false);




  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  console.log("CLIENT_ID:", process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  console.log("REQUEST_READY:", !!request);
  // Lắng nghe kết quả OAuth trả về
  useEffect(() => {
    if (response?.type === 'success') {
      const accessToken = response.params?.access_token;
      if (accessToken) {
        handleGoogleToken(accessToken);
      }
    } else if (response?.type === 'error') {
      Alert.alert('Lỗi', 'Xác thực Google thất bại. Vui lòng thử lại.');
    }
  }, [response]);

  // Lấy thông tin user từ Google API rồi gửi lên backend
  const handleGoogleToken = async (accessToken) => {
    setGoogleLoading(true);
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await res.json();

      const result = await loginWithGoogle({
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
      });

      if (!result.success) {
        Alert.alert('Lỗi', result.message || 'Đăng nhập Google thất bại');
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể lấy thông tin tài khoản Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email không hợp lệ';
    if (!password) newErrors.password = 'Vui lòng nhập mật khẩu';
    else if (password.length < 6) newErrors.password = 'Mật khẩu tối thiểu 6 ký tự';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const result = await login({ email: email.trim(), password });
    if (!result.success) {
      Alert.alert('Đăng nhập thất bại', result.message || 'Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>

        {/* Plant Illustration Header */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=400' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Heading */}
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>Chào mừng trở lại</Text>
          <Text style={styles.subheading}>
            Vui lòng đăng nhập để tiếp tục hành trình khám phá cùng TravelMate
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <CustomInput
            label="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
            placeholder="example@gmail.com"
            keyboardType="email-address"
            error={errors.email}
            leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.gray[400]} />}
          />

          {/* Password Label Row with forgot link inline */}
          <View style={styles.passwordLabelRow}>
            <Text style={styles.passwordLabel}>Mật khẩu</Text>
            <TouchableOpacity onPress={() => Alert.alert('Thông báo', 'Tính năng đang được phát triển!')}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>
          <CustomInput
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.gray[400]} />}
          />
        </View>

        {/* Login Button */}
        <CustomButton
          title="Đăng nhập"
          onPress={handleLogin}
          loading={isLoading}
          style={styles.loginBtn}
        />

        {/* Or divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Hoặc đăng nhập nhanh bằng</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google button */}
        <TouchableOpacity
          style={[styles.googleBtn, (googleLoading || isLoading) && { opacity: 0.6 }]}
          activeOpacity={0.85}
          onPress={() => promptAsync()}
          disabled={!request || isLoading || googleLoading}
        >
          {googleLoading ? (
            <Text style={styles.googleText}>Đang xác thực...</Text>
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.googleText}>Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerLabel}>Bạn chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}> Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  heroWrap: {
    height: 160,
    width: 160,
    alignSelf: 'center',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  headingWrap: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    marginBottom: SPACING.xs,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    marginBottom: SPACING.lg,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray[700],
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  registerLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  registerLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default LoginScreen;
