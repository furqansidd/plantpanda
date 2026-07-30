import { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { orderApi } from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';

export default function RideHistoryScreen() {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await orderApi.mineAsRider();
    setOrders(data.orders);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-white pt-14 px-5">
      <Text className="text-2xl font-bold mb-4">Ride History</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View className="border border-neutral-100 rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="font-semibold">Order #{item._id.slice(-6)}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text className="text-neutral-400 text-xs mb-1">{item.pickupAddress} → {item.deliveryAddress}</Text>
            <View className="flex-row justify-between mt-2">
              <Text className="text-brand-700 font-semibold text-sm">Your earning: Rs {item.deliveryFee}</Text>
              <Text className="text-neutral-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text className="text-neutral-400 text-center mt-16">No rides yet.</Text>}
      />
    </View>
  );
}
