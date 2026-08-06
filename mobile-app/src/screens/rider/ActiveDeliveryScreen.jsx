import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { orderApi, riderApi } from '../../api/endpoints';
import { connectSocket, getActiveSocket } from '../../api/socket';
import { useLiveRoute } from '../../hooks/useLiveRoute';
import StatusBadge from '../../components/StatusBadge';

export default function ActiveDeliveryScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [myPos, setMyPos] = useState(null); // rider's own live position
  const [pin, setPin] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const watchSubRef = useRef(null);

  const phase = order ? (order.status === 'picked_up' ? 'delivery' : 'pickup') : 'pickup';

  // Turn-by-turn road route driven by MY live position toward current destination
  const { points: routePoints, eta } = useLiveRoute(orderId, myPos, phase);

  const load = useCallback(async () => {
    const { data } = await orderApi.getById(orderId);
    setOrder(data.order);

    if (data.order.riderId?.currentLocation?.coordinates) {
      setMyPos({
        latitude: data.order.riderId.currentLocation.coordinates[1],
        longitude: data.order.riderId.currentLocation.coordinates[0],
      });
    }
  }, [orderId]);

  useEffect(() => {
    load();
    let ioClient = null;

    const onStatusUpdate = () => load();

    const setupSocket = async () => {
      try {
        ioClient = await connectSocket();
        if (ioClient && typeof ioClient.emit === 'function') {
          ioClient.emit('order:join', orderId);
          ioClient.on('order:statusUpdate', onStatusUpdate);
        }
      } catch (err) {
        console.warn('Socket connection error:', err.message);
      }
    };

    setupSocket();

    // Watch GPS while active, getting immediate current position and pinging backend & socket room
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      // 1. Get immediate current position on screen mount!
      try {
        const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!cancelled && currentLoc?.coords) {
          const initialPos = { latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude };
          setMyPos(initialPos);
          riderApi.pingLocation(currentLoc.coords.longitude, currentLoc.coords.latitude, orderId);
        }
      } catch (err) {
        console.warn('Initial location fetch error:', err.message);
      }

      // 2. Subscribe to continuous live updates safely
      try {
        watchSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 2 },
          (loc) => {
            if (cancelled || !loc?.coords) return;
            try {
              const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
              setMyPos(pos);
              riderApi.pingLocation(loc.coords.longitude, loc.coords.latitude, orderId);

              const activeIo = ioClient || getActiveSocket();
              if (activeIo && typeof activeIo.emit === 'function') {
                activeIo.emit('rider:location', {
                  lng: loc.coords.longitude,
                  lat: loc.coords.latitude,
                  activeOrderId: orderId,
                });
              }
            } catch (err) {
              console.warn('Location tick error:', err.message);
            }
          }
        );
      } catch (err) {
        console.warn('Watch location error:', err.message);
      }
    })();

    return () => {
      cancelled = true;
      watchSubRef.current?.remove();
      const activeIo = ioClient || getActiveSocket();
      if (activeIo && typeof activeIo.emit === 'function') {
        activeIo.emit('order:leave', orderId);
        activeIo.off('order:statusUpdate', onStatusUpdate);
      }
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

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <MapView
        style={{ flex: 1, minHeight: 220 }}
        initialRegion={{ latitude: nursery.latitude, longitude: nursery.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        <Marker coordinate={nursery} title="Nursery / Pickup" pinColor="green" />
        <Marker coordinate={dropoff} title="Customer Drop-off" pinColor="red" />
        {myPos && <Marker coordinate={myPos} title="You" pinColor="orange" />}
        {routePoints.length > 1 && <Polyline coordinates={routePoints} strokeColor="#16a34a" strokeWidth={4} />}
      </MapView>

      <ScrollView className="border-t border-neutral-100" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-semibold">Order #{order._id.slice(-6)}</Text>
          <StatusBadge status={order.status} />
        </View>

        {eta && eta.durationMin > 0 && (
          <Text className="text-neutral-400 text-xs mb-3">~{eta.durationMin} min • {eta.distanceKm} km to go</Text>
        )}

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
              returnKeyType="done"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
