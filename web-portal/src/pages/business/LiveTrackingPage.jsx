import { useEffect, useState } from 'react';
import { Bike, MapPin } from 'lucide-react';
import { orderApi } from '../../api/endpoints';
import { getSocket } from '../../api/socket';
import StatusBadge from '../../components/StatusBadge';

export default function LiveTrackingPage() {
  const [orders, setOrders] = useState([]);
  const [riderPositions, setRiderPositions] = useState({});

  const load = () =>
    orderApi.mineAsBusiness({ status: undefined }).then((res) => {
      const active = res.data.orders.filter((o) => ['rider_assigned', 'picked_up'].includes(o.status));
      setOrders(active);
    });

  useEffect(() => {
    load();
    const socket = getSocket();

    const onLocation = ({ riderId, lng, lat }) => {
      setRiderPositions((prev) => ({ ...prev, [riderId]: { lng, lat } }));
    };
    const onStatusUpdate = () => load();

    socket.on('rider:locationUpdate', onLocation);
    socket.on('order:statusUpdate', onStatusUpdate);
    socket.on('order:riderAssigned', onStatusUpdate);

    return () => {
      socket.off('rider:locationUpdate', onLocation);
      socket.off('order:statusUpdate', onStatusUpdate);
      socket.off('order:riderAssigned', onStatusUpdate);
    };
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Live Order Tracking</h2>
      {orders.length === 0 && (
        <p className="text-neutral-400 text-sm">No riders currently arriving or out for delivery.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((o) => {
          const pos = o.riderId ? riderPositions[o.riderId] : null;
          return (
            <div key={o._id} className="card p-4">
              <div className="flex justify-between items-start mb-3">
                <p className="font-semibold">Order #{o._id.slice(-6)}</p>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
                <Bike size={15} className="text-orange-500" />
                {o.status === 'rider_assigned' ? 'Rider heading to your location' : 'Rider heading to customer'}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <MapPin size={13} />
                {pos ? `Live position: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` : 'Waiting for GPS signal...'}
              </div>
              <div className="mt-3 h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${o.status === 'rider_assigned' ? 'bg-purple-400 w-1/2' : 'bg-cyan-400 w-full'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
