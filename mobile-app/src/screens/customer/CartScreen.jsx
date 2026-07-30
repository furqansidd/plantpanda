import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, total, businessName } = useCart();

  return (
    <View className="flex-1 bg-white pt-14 px-5">
      <Text className="text-2xl font-bold mb-1">Your Cart</Text>
      {businessName && <Text className="text-neutral-400 text-sm mb-4">From {businessName}</Text>}

      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between py-3 border-b border-neutral-100">
            <View className="flex-1">
              <Text className="font-medium">{item.name}</Text>
              <Text className="text-neutral-400 text-xs">Rs {item.price} each</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                <Minus size={16} color="#666" />
              </TouchableOpacity>
              <Text className="font-semibold w-5 text-center">{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                <Plus size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateQuantity(item.productId, 0)} className="ml-1">
                <Trash2 size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text className="text-neutral-400 text-center mt-16">Your cart is empty.</Text>}
      />

      {items.length > 0 && (
        <View className="border-t border-neutral-100 pt-4 pb-6">
          <View className="flex-row justify-between mb-4">
            <Text className="text-neutral-500">Items Total</Text>
            <Text className="font-bold">Rs {total}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Checkout')}
            className="bg-brand-600 rounded-xl py-3.5 items-center"
          >
            <Text className="text-white font-semibold">Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
