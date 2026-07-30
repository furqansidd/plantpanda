import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal } from 'react-native';
import { AlertTriangle, History } from 'lucide-react-native';
import { riderApi } from '../../api/endpoints';

export default function LedgerScreen() {
  const [ledgers, setLedgers] = useState([]);
  const [historyModal, setHistoryModal] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const load = () => riderApi.ledgers().then((res) => setLedgers(res.data.ledgers));

  useEffect(() => {
    load();
  }, []);

  const openHistory = async (ledger) => {
    setHistoryModal(ledger);
    const { data } = await riderApi.ledgerTransactions(ledger._id);
    setTransactions(data.transactions);
  };

  const totalOwed = ledgers.reduce((sum, l) => sum + l.outstandingAmount, 0);

  return (
    <View className="flex-1 bg-white pt-14 px-5">
      <Text className="text-2xl font-bold mb-1">Cash Balances</Text>
      <Text className="text-neutral-400 text-sm mb-4">Money you owe to businesses from COD collections</Text>

      <View className="bg-neutral-50 rounded-2xl p-4 mb-5">
        <Text className="text-neutral-500 text-sm">Total You Owe</Text>
        <Text className="text-2xl font-bold mt-1">Rs {totalOwed.toLocaleString()}</Text>
      </View>

      <FlatList
        data={ledgers}
        keyExtractor={(l) => l._id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View className="border border-neutral-100 rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="font-semibold">{item.businessId?.name}</Text>
                <Text className="text-neutral-400 text-xs">{item.businessId?.address}</Text>
              </View>
              {item.isBlocked && (
                <View className="flex-row items-center gap-1 bg-red-100 px-2 py-1 rounded-full">
                  <AlertTriangle size={11} color="#dc2626" />
                  <Text className="text-red-700 text-xs font-semibold">Blocked</Text>
                </View>
              )}
            </View>
            <View className="flex-row justify-between items-center">
              <Text className={`text-lg font-bold ${item.outstandingAmount > 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                Rs {item.outstandingAmount.toLocaleString()} owed
              </Text>
              <TouchableOpacity onPress={() => openHistory(item)} className="flex-row items-center gap-1">
                <History size={14} color="#666" />
                <Text className="text-neutral-500 text-xs">History</Text>
              </TouchableOpacity>
            </View>
            {item.isBlocked && (
              <Text className="text-red-600 text-xs mt-2">
                Please deliver this cash to the business in person — you cannot accept any new orders until this is
                settled.
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text className="text-neutral-400 text-center mt-10">No cash balances yet.</Text>}
      />

      <Modal visible={!!historyModal} transparent animationType="slide" onRequestClose={() => setHistoryModal(null)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-bold text-lg">{historyModal?.businessId?.name}</Text>
              <TouchableOpacity onPress={() => setHistoryModal(null)}>
                <Text className="text-neutral-400">Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={transactions}
              keyExtractor={(t) => t._id}
              renderItem={({ item }) => (
                <View className="flex-row justify-between border-b border-neutral-50 py-2.5">
                  <View>
                    <Text className={`font-medium text-sm ${item.type === 'collection' ? 'text-red-600' : 'text-green-600'}`}>
                      {item.type === 'collection' ? '+ Collected' : '− Paid'} Rs {item.amount}
                    </Text>
                    <Text className="text-neutral-400 text-xs">{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                  <Text className="text-neutral-400 text-xs">Left: Rs {item.balanceAfter}</Text>
                </View>
              )}
              ListEmptyComponent={<Text className="text-neutral-400 text-center py-6">No transactions yet.</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
