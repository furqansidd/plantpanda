import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, Modal, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { AlertTriangle } from 'lucide-react-native';
import { riderApi } from '../../api/endpoints';
import { getActiveSocket, connectSocket } from '../../api/socket';
import { useAuth } from '../../context/AuthContext';

export default function RiderDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ledgers, setLedgers] = useState([]);
  const [globallyBlocked, setGloballyBlocked] = useState(false);
  const [dispatchOffer, setDispatchOffer] = useState(null); // { orderId, business, deliveryFee, ... }
  const [watchSub, setWatchSub] = useState(null);

  const loadLedgers = useCallback(async () => {
    const { data } = await riderApi.ledgers();
    setLedgers(data.ledgers);
    setGloballyBlocked(data.globallyBlocked);
  }, []);

  useEffect(() => {
    loadLedgers();
    let ioClient = getActiveSocket();

    const setupSocket = async () => {
      try {
        ioClient = ioClient || (await connectSocket());
        if (!ioClient) return;
        ioClient.on('order:available', (offer) => setDispatchOffer(offer));
        ioClient.on('ledger:updated', () => loadLedgers());
      } catch (err) {
        console.warn('Dashboard socket error:', err.message);
      }
    };
    setupSocket();

    return () => {
      if (ioClient) {
        ioClient.off('order:available');
        ioClient.off('ledger:updated');
      }
    };
  }, [loadLedgers]);

  const toggleOnline = async (value) => {
    setError('');
    setBusy(true);
    try {
      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission is required to go online');
        const pos = await Location.getCurrentPositionAsync({});
        await riderApi.goOnline(pos.coords.longitude, pos.coords.latitude);

        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 5 },
          (loc) => {
            if (!loc?.coords) return;
            try {
              riderApi.pingLocation(loc.coords.longitude, loc.coords.latitude);
              const activeIo = getActiveSocket();
              activeIo?.emit('rider:location', { lng: loc.coords.longitude, lat: loc.coords.latitude });
            } catch (err) {
              console.warn('Online ping error:', err.message);
            }
          }
        );
        setWatchSub(sub);
        setIsOnline(true);
      } else {
        await riderApi.goOffline();
        watchSub?.remove();
        setWatchSub(null);
        setIsOnline(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not update status');
    } finally {
      setBusy(false);
    }
  };

  const acceptOffer = async () => {
    try {
      await riderApi.acceptOrder(dispatchOffer.orderId);
      setDispatchOffer(null);
      navigation.navigate('ActiveDelivery', { orderId: dispatchOffer.orderId });
    } catch (err) {
      Alert.alert('Order unavailable', err.response?.data?.message || 'This order was just claimed by another rider.');
      setDispatchOffer(null);
    }
  };

  return (
    <View className="flex-1 bg-white pt-14 px-5">
      <Text className="text-2xl font-bold mb-1">Rider Dashboard</Text>
      <Text className="text-neutral-400 mb-6">Welcome back, {user?.name?.split(' ')[0]}</Text>

      {globallyBlocked && (
        <View className="bg-red-50 rounded-xl p-4 mb-4 flex-row gap-2 items-start">
          <AlertTriangle size={18} color="#dc2626" />
          <Text className="text-red-700 text-xs flex-1">
            You have reached the Rs 5,000 cash limit with a business. Settle that balance in the "Cash Balances"
            tab before you can go online and accept new orders — this applies to all deliveries, not just that
            business.
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between border border-neutral-100 rounded-2xl p-4 mb-6">
        <View>
          <Text className="font-semibold">{isOnline ? 'You are Online' : 'You are Offline'}</Text>
          <Text className="text-neutral-400 text-xs">
            {isOnline ? 'Receiving nearby delivery requests' : 'Go online to start receiving orders'}
          </Text>
        </View>
        {busy ? (
          <ActivityIndicator />
        ) : (
          <Switch value={isOnline} onValueChange={toggleOnline} disabled={globallyBlocked} trackColor={{ true: '#16a34a' }} />
        )}
      </View>

      {error ? <Text className="text-red-600 text-sm mb-4">{error}</Text> : null}

      <Text className="font-semibold mb-2">Outstanding Cash Balances</Text>
      {ledgers.filter((l) => l.outstandingAmount > 0).map((l) => (
        <View key={l._id} className="flex-row justify-between items-center border-b border-neutral-50 py-2.5">
          <Text className="text-sm">{l.businessId?.name}</Text>
          <Text className={`text-sm font-semibold ${l.isBlocked ? 'text-red-600' : 'text-neutral-700'}`}>
            Rs {l.outstandingAmount.toLocaleString()}
          </Text>
        </View>
      ))}
      {ledgers.filter((l) => l.outstandingAmount > 0).length === 0 && (
        <Text className="text-neutral-400 text-sm">No outstanding cash balances. You're all clear!</Text>
      )}

      {/* Instant Order Dispatch Modal */}
      <Modal visible={!!dispatchOffer} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold mb-1">New Delivery Request 🌱</Text>
            <Text className="text-neutral-400 text-sm mb-4">{dispatchOffer?.business?.name}</Text>

            <View className="bg-neutral-50 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between mb-1">
                <Text className="text-neutral-500 text-sm">Your Earning</Text>
                <Text className="font-bold text-brand-700">Rs {dispatchOffer?.deliveryFee}</Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-neutral-500 text-sm">Distance</Text>
                <Text className="text-sm">{dispatchOffer?.distanceKm} km</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-neutral-500 text-sm">Pickup</Text>
                <Text className="text-sm flex-1 text-right" numberOfLines={2}>{dispatchOffer?.pickupAddress}</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setDispatchOffer(null)} className="flex-1 border border-neutral-200 rounded-xl py-3.5 items-center">
                <Text className="font-semibold text-neutral-600">Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={acceptOffer} className="flex-1 bg-brand-600 rounded-xl py-3.5 items-center">
                <Text className="font-semibold text-white">Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
