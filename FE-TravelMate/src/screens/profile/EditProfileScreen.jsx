import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import useAuth from '../../hooks/useAuth';
import { COLORS, SPACING } from '../../utils/constants';

const EditProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');

  const handleSave = async () => {
    Alert.alert('Thông báo', 'Chức năng cập nhật hồ sơ sẽ sớm có. Backend chưa hỗ trợ endpoint PATCH /profile.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Chỉnh sửa hồ sơ" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <CustomInput
          label="Họ tên"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.gray[400]} />}
        />
        <CustomInput
          label="Email"
          value={user?.email || ''}
          editable={false}
          leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.gray[400]} />}
        />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <CustomButton title="Lưu thay đổi" onPress={handleSave} size="lg" />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md },
  bottomBar: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
});

export default EditProfileScreen;
