import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import useAuth from '../../hooks/useAuth';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>

        {/* Plant/hero image */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={['#DCFCE7', '#BBF7D0', '#86EFAC']}
            style={styles.heroGradient}
          >
            <Ionicons name="leaf" size={80} color="#16A34A" style={{ opacity: 0.8 }} />
          </LinearGradient>
        </View>

        {/* Heading */}
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>Chào mừng trở lại</Text>
          <Text style={styles.subheading}>
            Vui lòng đăng nhập để tiếp tục hành{'\n'}trình khám phá cùng TravelMate
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
          <CustomInput
            label="Mật khẩu"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.gray[400]} />}
          />

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <CustomButton
          title="Đăng nhập"
          onPress={handleLogin}
          loading={isLoading}
          style={styles.loginBtn}
        />

        {/* Or divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Hoặc đăng nhập nhận bằng</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google button */}
        <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85}>
          <View style={styles.googleIconWrap}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.googleText}>Google</Text>
        </TouchableOpacity>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerLabel}>Bạn chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}> Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: SPACING.md,
  },
  heroWrap: {
    height: 180,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingWrap: {
    marginBottom: SPACING.xl,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.gray[500],
    lineHeight: 22,
  },
  form: {
    marginBottom: SPACING.sm,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: SPACING.md,
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginBtn: {
    marginBottom: SPACING.lg,
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
    color: COLORS.gray[500],
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginBottom: SPACING.lg,
  },
  googleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerLabel: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  registerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default LoginScreen;
