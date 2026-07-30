import { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { orderApi } from '../../api/endpoints';
import { getSocket } from '../../api/socket';
import StatusBadge from '../../components/StatusBadge';

export default function TrackingScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [riderPos, setRiderPos] = useState(null);
  const [phase, setPhase] = useState('pickup'); // 'pickup' | 'delivery'

  const load = useCallback(async () => {
    const { data } = await orderApi.getById(orderId);
    setOrder(data.order);
    setPhase(data.order.status === 'picked_up' ? 'delivery' : 'pickup');
  }, [orderId]);

  useEffect(() => {
    load();
    const socket = getSocket();
    if (!socket) return;

    socket.emit('order:join', orderId);

    const onLocation = ({ lng, lat }) => setRiderPos({ latitude: lat, longitude: lng });
    const onPhaseChange = ({ phase: newPhase }) => setPhase(newPhase);
    const onStatusUpdate = () => load();

    socket.on('rider:locationUpdate', onLocation);
    socket.on('order:phaseChange', onPhaseChange);
    socket.on('order:statusUpdate', onStatusUpdate);
    socket.on('order:riderAssigned', onStatusUpdate);

    return () => {
      socket.emit('order:leave', orderId);
      socket.off('rider:locationUpdate', onLocation);
      socket.off('order:phaseChange', onPhaseChange);
      socket.off('order:statusUpdate', onStatusUpdate);
      socket.off('order:riderAssigned', onStatusUpdate);
    };
  }, [orderId, load]);

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  const nursery = {
    latitude: order.pickupLocation.coordinates[1],
    longitude: order.pickupLocation.coordinates[0],
  };
  const dropoff = {
    latitude: order.deliveryLocation.coordinates[1],
    longitude: order.deliveryLocation.coordinates[0],
  };

  // Phase 1: rider -> nursery. Phase 2: nursery -> customer drop-off (polyline switches automatically).
  const routePoints = phase === 'pickup' ? [riderPos, nursery].filter(Boolean) : [nursery, dropoff];

  return (
    <View className="flex-1 bg-white">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: nursery.latitude,
          longitude: nursery.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={nursery} title="Nursery" pinColor="green" />
        <Marker coordinate={dropoff} title="Delivery Address" pinColor="red" />
        {riderPos && <Marker coordinate={riderPos} title="Rider" pinColor="orange" />}
        {routePoints.length === 2 && <Polyline coordinates={routePoints} strokeColor="#16a34a" strokeWidth={4} />}
      </MapView>

      <View className="p-5 border-t border-neutral-100 bg-white">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-semibold">Order #{order._id.slice(-6)}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text className="text-neutral-500 text-sm mb-3">
          {phase === 'pickup'
            ? 'Your rider is heading to the nursery to pick up your plants.'
            : 'Your rider has your plants and is heading your way!'}
        </Text>
        <View className="bg-brand-50 rounded-xl p-3">
          <Text className="text-brand-700 text-xs font-semibold">
            Delivery PIN: {order.deliveryPIN} — share this with your rider only when they arrive.
          </Text>
        </View>
      </View>
    </View>
  );
}
