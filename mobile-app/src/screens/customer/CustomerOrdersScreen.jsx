import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { orderApi } from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';

export default function CustomerOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await orderApi.mineAsCustomer();
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

  const isTrackable = (status) => ['accepted', 'ready_for_pickup', 'rider_assigned', 'picked_up'].includes(status);

  return (
    <View className="flex-1 bg-white pt-14 px-5">
      <Text className="text-2xl font-bold mb-4">My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => isTrackable(item.status) && navigation.navigate('Tracking', { orderId: item._id })}
            className="border border-neutral-100 rounded-2xl p-4 mb-3"
          >
            <View className="flex-row justify-between items-start mb-1">
              <Text className="font-semibold">Order #{item._id.slice(-6)}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text className="text-neutral-400 text-xs mb-1">{item.items.length} item(s) • Rs {item.totalAmount}</Text>
            <Text className="text-neutral-400 text-xs">{new Date(item.createdAt).toLocaleString()}</Text>
            {isTrackable(item.status) && <Text className="text-brand-700 text-xs font-semibold mt-2">Tap to track live →</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text className="text-neutral-400 text-center mt-16">No orders yet — go browse some plants!</Text>}
      />
    </View>
  );
}
