import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, FONTS } from '../../utils/constants';

/**
 * CustomButton — supports primary (gradient), secondary (outlined), and text variants
 */
const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: RADIUS.md },
    md: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: RADIUS.md },
    lg: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: RADIUS.lg },
  };

  const textSizes = {
    sm: FONTS.sizes.sm,
    md: FONTS.sizes.md,
    lg: FONTS.sizes.lg,
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#F97316', '#EA6C0A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btn, sizeStyles[size]]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <View style={styles.row}>
              {icon && <View style={styles.iconWrap}>{icon}</View>}
              <Text style={[styles.primaryText, { fontSize: textSizes[size] }, textStyle]}>
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.btn,
          styles.outlined,
          sizeStyles[size],
          { opacity: isDisabled ? 0.6 : 1 },
          style,
        ]}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.secondaryText, { fontSize: textSizes[size] }, textStyle]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Text button
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}
      activeOpacity={0.7}
    >
      <Text style={[styles.textBtn, { fontSize: textSizes[size] }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: SPACING.xs,
  },
  primaryText: {
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  textBtn: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default CustomButton;
