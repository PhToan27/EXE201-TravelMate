import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../utils/constants';

const Header = ({
  title,
  subtitle,
  onBack,
  rightComponent,
  transparent = false,
  light = false,
}) => {
  const insets = useSafeAreaInsets();
  const textColor = light ? COLORS.white : COLORS.black;
  const iconColor = light ? COLORS.white : COLORS.gray[700];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + SPACING.sm },
        transparent && styles.transparent,
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={iconColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={[styles.subtitle, { color: light ? 'rgba(255,255,255,0.8)' : COLORS.gray[500] }]}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.right}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  right: {
    width: 40,
    alignItems: 'flex-end',
  },
});

export default Header;
