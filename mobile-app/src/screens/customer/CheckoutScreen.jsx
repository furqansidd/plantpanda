import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useCart } from '../../context/CartContext';
import { orderApi } from '../../api/endpoints';

export default function CheckoutScreen({ navigation }) {
  const { items, total, businessId, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const placeOrder = async () => {
    if (!address.trim()) {
      setError('Please enter a delivery address');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let coords = [73.0839, 31.4227]; // fallback default
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        coords = [pos.coords.longitude, pos.coords.latitude];
      }

      const { data } = await orderApi.create({
        businessId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: address,
        deliveryLocation: coords,
      });

      clearCart();
      Alert.alert('Order placed!', 'Track your order live once the nursery accepts it.');
      navigation.reset({ index: 0, routes: [{ name: 'Orders' }] });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-white pt-14 px-5">
      <Text className="text-2xl font-bold mb-6">Checkout</Text>

      <Text className="text-sm font-medium text-neutral-700 mb-1">Delivery Address</Text>
      <TextInput
        placeholder="House #, street, area..."
        value={address}
        onChangeText={setAddress}
        multiline
        className="border border-neutral-200 rounded-xl px-4 py-3 mb-4 h-20"
      />

      <View className="bg-neutral-50 rounded-xl p-4 mb-6">
        <Text className="font-semibold mb-2">Order Summary</Text>
        {items.map((i) => (
          <View key={i.productId} className="flex-row justify-between mb-1">
            <Text className="text-neutral-500 text-sm">{i.name} × {i.quantity}</Text>
            <Text className="text-sm">Rs {i.price * i.quantity}</Text>
          </View>
        ))}
        <View className="flex-row justify-between mt-2 pt-2 border-t border-neutral-200">
          <Text className="font-semibold">Items Total</Text>
          <Text className="font-semibold">Rs {total}</Text>
        </View>
        <Text className="text-xs text-neutral-400 mt-2">
          Delivery fee is calculated automatically based on distance and shown before rider dispatch.
          Payment: Cash on Delivery.
        </Text>
      </View>

      {error ? <Text className="text-red-600 text-sm mb-3">{error}</Text> : null}

      <TouchableOpacity
        onPress={placeOrder}
        disabled={busy}
        className="bg-brand-600 rounded-xl py-3.5 items-center"
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        {busy ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Place Order (COD)</Text>}
      </TouchableOpacity>
    </View>
  );
}
