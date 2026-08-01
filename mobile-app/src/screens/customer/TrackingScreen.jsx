import { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { orderApi } from '../../api/endpoints';
import { connectSocket } from '../../api/socket';
import { useLiveRoute } from '../../hooks/useLiveRoute';
import StatusBadge from '../../components/StatusBadge';

export default function TrackingScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [riderPos, setRiderPos] = useState(null);
  const [phase, setPhase] = useState('pickup'); // 'pickup' | 'delivery'

  // Route line always runs from the rider's LIVE position to the fixed destination
  // for the current phase; it re-fetches from the backend (OpenRouteService) as
  // the rider moves, so it follows real roads and shortens behind him.
  const { points: routePoints, eta } = useLiveRoute(orderId, riderPos, phase);

  const load = useCallback(async () => {
    const { data } = await orderApi.getById(orderId);
    setOrder(data.order);
    const currentPhase = data.order.status === 'picked_up' ? 'delivery' : 'pickup';
    setPhase(currentPhase);

    if (data.order.riderId?.currentLocation?.coordinates) {
      setRiderPos({
        latitude: data.order.riderId.currentLocation.coordinates[1],
        longitude: data.order.riderId.currentLocation.coordinates[0],
      });
    }
  }, [orderId]);

  useEffect(() => {
    load();
    let socket = null;

    const setupSocket = async () => {
      socket = await connectSocket();
      if (!socket || typeof socket.emit !== 'function') return;

      socket.emit('order:join', orderId);
      socket.on('rider:locationUpdate', onLocation);
      socket.on('order:phaseChange', onPhaseChange);
      socket.on('order:statusUpdate', onStatusUpdate);
      socket.on('order:riderAssigned', onStatusUpdate);
    };

    const onLocation = ({ lng, lat }) => setRiderPos({ latitude: lat, longitude: lng });
    const onPhaseChange = ({ phase: newPhase }) => setPhase(newPhase);
    const onStatusUpdate = () => load();

    setupSocket();

    return () => {
      if (socket && typeof socket.emit === 'function') {
        socket.emit('order:leave', orderId);
        socket.off('rider:locationUpdate', onLocation);
        socket.off('order:phaseChange', onPhaseChange);
        socket.off('order:statusUpdate', onStatusUpdate);
        socket.off('order:riderAssigned', onStatusUpdate);
      }
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

  // Fixed destination pin for the current phase — this NEVER moves.
  const destination = phase === 'pickup' ? nursery : dropoff;

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
        {routePoints.length > 1 && <Polyline coordinates={routePoints} strokeColor="#16a34a" strokeWidth={4} />}
      </MapView>

      <View className="p-5 border-t border-neutral-100 bg-white">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-semibold">Order #{order._id.slice(-6)}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text className="text-neutral-500 text-sm mb-1">
          {phase === 'pickup'
            ? 'Your rider is heading to the nursery to pick up your plants.'
            : 'Your rider has your plants and is heading your way!'}
        </Text>
        {eta && eta.durationMin > 0 && (
          <Text className="text-neutral-400 text-xs mb-3">
            ~{eta.durationMin} min • {eta.distanceKm} km away
          </Text>
        )}
        <View className="bg-brand-50 rounded-xl p-3">
          <Text className="text-brand-700 text-xs font-semibold">
            Delivery PIN: {order.deliveryPIN} — share this with your rider only when they arrive.
          </Text>
        </View>
      </View>
    </View>
  );
}
