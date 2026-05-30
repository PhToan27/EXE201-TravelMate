import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import TripCard from '../../components/trip/TripCard';
import EmptyState from '../../components/common/EmptyState';
import CustomButton from '../../components/common/CustomButton';
import useTrip from '../../hooks/useTrip';
import { COLORS, SPACING } from '../../utils/constants';

const SavedTripsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { trips, isLoading, fetchTrips, deleteTrip } = useTrip(true);

  const handleDelete = (tripId, destination) => {
    Alert.alert(
      'Xóa chuyến đi',
      `Bạn có chắc muốn xóa chuyến đi đến ${destination}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteTrip(tripId),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Chuyến đi của tôi"
        subtitle={`${trips.length} chuyến đi`}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={trips}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + SPACING.lg },
          trips.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchTrips}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="airplane-outline"
              title="Chưa có chuyến đi nào"
              subtitle="Tạo chuyến đi đầu tiên và trải nghiệm lập kế hoạch thông minh với AI"
              action={
                <CustomButton
                  title="Tạo chuyến đi mới"
                  onPress={() => navigation.navigate('CreateTrip')}
                />
              }
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() => navigation.navigate('TripDetail', { tripId: item._id })}
            onDelete={() => handleDelete(item._id, item.destination)}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
  },
  emptyList: {
    flex: 1,
  },
});

export default SavedTripsScreen;
