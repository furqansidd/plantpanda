import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { orderApi } from '../../api/endpoints';
import { getSocket } from '../../api/socket';
import StatusBadge from '../../components/StatusBadge';

export default function ActiveDeliveryScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [pin, setPin] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await orderApi.getById(orderId);
    setOrder(data.order);
  }, [orderId]);

  useEffect(() => {
    load();
    const socket = getSocket();
    if (!socket) return;
    socket.emit('order:join', orderId);
    const onStatusUpdate = () => load();
    socket.on('order:statusUpdate', onStatusUpdate);
    return () => {
      socket.emit('order:leave', orderId);
      socket.off('order:statusUpdate', onStatusUpdate);
    };
  }, [orderId, load]);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const confirmDelivery = async () => {
    if (pin.length !== 4) {
      setError('Enter the 4-digit delivery PIN from the customer');
      return;
    }
    setBusy(true);
    setError('');
    try {
      // NOTE: in production, photoUri would be uploaded to object storage first;
      // this MVP passes a placeholder URL string to keep the flow complete end-to-end.
      const { data } = await orderApi.verifyDeliveryPIN(orderId, pin, photoUri ? 'uploaded-pod-photo.jpg' : undefined);
      Alert.alert(
        'Delivered! 🎉',
        `Cash collected has been added to your balance. Outstanding for this business: Rs ${data.codStatus.outstandingAmount}.` +
          (data.codStatus.isBlocked
            ? ' You have reached the Rs 5,000 limit and must settle before accepting new orders.'
            : '')
      );
      navigation.reset({ index: 0, routes: [{ name: 'RiderDashboard' }] });
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect PIN');
    } finally {
      setBusy(false);
    }
  };

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  const nursery = { latitude: order.pickupLocation.coordinates[1], longitude: order.pickupLocation.coordinates[0] };
  const dropoff = { latitude: order.deliveryLocation.coordinates[1], longitude: order.deliveryLocation.coordinates[0] };
  const phase = order.status === 'rider_assigned' ? 'pickup' : 'delivery';

  return (
    <View className="flex-1 bg-white">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude: nursery.latitude, longitude: nursery.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        <Marker coordinate={nursery} title="Nursery / Pickup" pinColor="green" />
        <Marker coordinate={dropoff} title="Customer Drop-off" pinColor="red" />
        <Polyline
          coordinates={phase === 'pickup' ? [nursery] : [nursery, dropoff]}
          strokeColor="#16a34a"
          strokeWidth={4}
        />
      </MapView>

      <View className="p-5 border-t border-neutral-100">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-semibold">Order #{order._id.slice(-6)}</Text>
          <StatusBadge status={order.status} />
        </View>

        {phase === 'pickup' ? (
          <View className="bg-purple-50 rounded-xl p-4">
            <Text className="text-purple-700 text-sm font-medium mb-1">Step 1: Go to the nursery</Text>
            <Text className="text-purple-600 text-xs">{order.pickupAddress}</Text>
            <Text className="text-purple-600 text-xs mt-2">
              Give the nursery staff your pickup PIN: {order.pickupPIN}
            </Text>
          </View>
        ) : (
          <View>
            <View className="bg-cyan-50 rounded-xl p-4 mb-4">
              <Text className="text-cyan-700 text-sm font-medium mb-1">Step 2: Deliver to customer</Text>
              <Text className="text-cyan-600 text-xs">{order.deliveryAddress}</Text>
            </View>

            <Text className="text-sm font-medium text-neutral-700 mb-1">Enter Customer's Delivery PIN</Text>
            <TextInput
              maxLength={4}
              keyboardType="number-pad"
              value={pin}
              onChangeText={(v) => setPin(v.replace(/\D/g, ''))}
              placeholder="----"
              className="border border-neutral-200 rounded-xl px-4 py-3 mb-3 text-center text-2xl tracking-widest"
            />

            <TouchableOpacity onPress={takePhoto} className="border border-neutral-200 rounded-xl py-3 items-center mb-3">
              <Text className="text-neutral-600 text-sm font-medium">
                {photoUri ? 'Photo captured ✓ (retake)' : 'Take Proof of Delivery Photo (optional)'}
              </Text>
            </TouchableOpacity>

            {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

            <TouchableOpacity
              onPress={confirmDelivery}
              disabled={busy}
              className="bg-brand-600 rounded-xl py-3.5 items-center"
              style={{ opacity: busy ? 0.6 : 1 }}
            >
              <Text className="text-white font-semibold">{busy ? 'Confirming...' : 'Confirm Delivery'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
