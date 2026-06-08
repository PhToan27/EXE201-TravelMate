import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as postApi from '../../services/community/postApi';
import { COLORS, RADIUS, SPACING } from '../../utils/constants';

const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await postApi.getNotifications();
      if (result.success) setItems(result.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const openNotification = async (item) => {
    if (!item.read) await postApi.markNotificationRead(item._id);
    if (item.post?._id) navigation.navigate('PostDetail', { postId: item.post._id });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Thông báo" onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.xl }]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} colors={[COLORS.primary]} />}
        >
          {items.map((item) => (
            <TouchableOpacity key={item._id} style={[styles.card, !item.read && styles.unread]} onPress={() => openNotification(item)}>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.meta}>{item.actor?.name || 'TravelMate'} • {item.post?.title || 'Hệ thống'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const Header = ({ title, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.back} onPress={onBack}><Ionicons name="arrow-back" size={22} color={COLORS.black} /></TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.back} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.white },
  back: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: COLORS.black },
  list: { padding: SPACING.md, gap: SPACING.sm },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md },
  unread: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  message: { fontSize: 14, fontWeight: '800', color: COLORS.black },
  meta: { marginTop: 6, fontSize: 12, color: COLORS.gray[500] },
});

export default NotificationsScreen;
