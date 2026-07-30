import { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { riderApi } from '../../api/endpoints';

export default function EarningsScreen() {
  const [data, setData] = useState({ totalEarned: 0, pendingPayout: 0, earnings: [] });

  useEffect(() => {
    riderApi.earnings().then((res) => setData(res.data));
  }, []);

  return (
    <View className="flex-1 bg-white pt-14 px-5">
      <Text className="text-2xl font-bold mb-4">My Earnings</Text>

      <View className="bg-brand-50 rounded-2xl p-5 mb-6">
        <Text className="text-brand-700 text-sm">Total Earned (delivery fees)</Text>
        <Text className="text-3xl font-bold text-brand-800 mt-1">Rs {data.totalEarned.toLocaleString()}</Text>
        <Text className="text-brand-600 text-xs mt-1">Pending payout: Rs {data.pendingPayout.toLocaleString()}</Text>
      </View>

      <Text className="font-semibold mb-2">Earning History</Text>
      <FlatList
        data={data.earnings}
        keyExtractor={(e) => e._id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View className="flex-row justify-between items-center border-b border-neutral-50 py-3">
            <View>
              <Text className="text-sm font-medium">Order #{item.orderId?.toString().slice(-6)}</Text>
              <Text className="text-neutral-400 text-xs">{item.distanceKm} km • {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text className="font-semibold text-brand-700">+ Rs {item.amount}</Text>
          </View>
        )}
        ListEmptyComponent={<Text className="text-neutral-400 text-center mt-10">No earnings yet.</Text>}
      />
    </View>
  );
}
