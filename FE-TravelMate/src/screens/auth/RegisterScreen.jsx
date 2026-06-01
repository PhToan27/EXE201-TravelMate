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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import useAuth from '../../hooks/useAuth';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

const RegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ';
    if (!password) e.password = 'Vui lòng nhập mật khẩu';
    else if (password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (!confirmPassword) e.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (password !== confirmPassword) e.confirmPassword = 'Mật khẩu không khớp';
    if (!agreed) e.agreed = 'Bạn cần đồng ý với điều khoản';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    const result = await register({ name: name.trim(), email: email.trim(), password });
    if (!result.success) {
      Alert.alert('Đăng ký thất bại', result.message || 'Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>

        {/* Heading */}
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>Tham gia TravelMate</Text>
          <Text style={styles.subheading}>
            Bắt đầu hành trình khám phá thế giới cùng cộng đồng du lịch hàng đầu.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <CustomInput
            label="Họ tên"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
            placeholder="Nhập họ và tên của bạn"
            autoCapitalize="words"
            error={errors.name}
            leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.gray[400]} />}
          />

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
            placeholder="Nhập mật khẩu"
            secureTextEntry
            error={errors.password}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.gray[400]} />}
          />

          <CustomInput
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry
            error={errors.confirmPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.gray[400]} />}
          />

          {/* Terms checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => { setAgreed(!agreed); setErrors((e) => ({ ...e, agreed: '' })); }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
            </View>
            <Text style={styles.termsText}>
              Tôi đồng ý với{' '}
              <Text style={styles.termsLink}>Điều khoản</Text>
              {' '}và{' '}
              <Text style={styles.termsLink}>Chính sách</Text>
            </Text>
          </TouchableOpacity>
          {errors.agreed && <Text style={styles.termsError}>{errors.agreed}</Text>}
        </View>

        {/* Register button */}
        <CustomButton
          title="Tạo tài khoản"
          onPress={handleRegister}
          loading={isLoading}
          style={styles.registerBtn}
          icon={<Ionicons name="person-add-outline" size={18} color={COLORS.white} />}
        />

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>Đã có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> Đăng nhập ngay</Text>
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
    marginBottom: SPACING.xs,
  },
  headerContainer: {
    marginBottom: SPACING.lg,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.gray[500],
    lineHeight: 20,
  },
  form: {
    marginBottom: SPACING.xs,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    fontSize: 13,
    color: COLORS.gray[600],
    flex: 1,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  termsError: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 2,
  },
  registerBtn: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loginLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  loginLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default RegisterScreen;
