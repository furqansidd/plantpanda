import { useEffect, useState } from 'react';
import { orderApi } from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';

export default function OrdersPipelinePage() {
  const [orders, setOrders] = useState([]);
  const [pinModalOrder, setPinModalOrder] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');

  const load = () => orderApi.mineAsBusiness().then((res) => setOrders(res.data.orders));

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000); // simple polling refresh alongside socket events
    return () => clearInterval(interval);
  }, []);

  const accept = async (id) => {
    try {
      await orderApi.accept(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept order. Make sure your business account is approved.');
    }
  };

  const markReady = async (id) => {
    try {
      await orderApi.markReady(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark order ready for pickup.');
    }
  };

  const submitPickupPin = async () => {
    setError('');
    try {
      await orderApi.verifyPickupPIN(pinModalOrder._id, pinInput);
      setPinModalOrder(null);
      setPinInput('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid PIN');
    }
  };

  const groups = [
    { status: 'pending', label: 'New Orders' },
    { status: 'accepted', label: 'Preparing' },
    { status: 'ready_for_pickup', label: 'Awaiting Rider' },
    { status: 'rider_assigned', label: 'Rider En Route' },
    { status: 'picked_up', label: 'Out for Delivery' },
    { status: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const list = orders.filter((o) => o.status === g.status);
        if (list.length === 0) return null;
        return (
          <div key={g.status}>
            <h3 className="font-semibold text-sm text-neutral-500 mb-2">{g.label} ({list.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {list.map((o) => (
                <div key={o._id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Order #{o._id.slice(-6)}</p>
                      <p className="text-xs text-neutral-400">{o.items.length} item(s) • Rs {o.itemsTotal} receivable</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">Deliver to: {o.deliveryAddress}</p>

                  {o.status === 'pending' && (
                    <button onClick={() => accept(o._id)} className="btn-primary text-sm mt-3 w-full">
                      Accept Order
                    </button>
                  )}
                  {o.status === 'accepted' && (
                    <button onClick={() => markReady(o._id)} className="btn-primary text-sm mt-3 w-full">
                      Mark Ready for Pickup
                    </button>
                  )}
                  {o.status === 'ready_for_pickup' && (
                    <p className="text-xs text-purple-600 mt-3">Broadcasting to nearby riders ({o.dispatchRadiusKm}km radius)...</p>
                  )}
                  {o.status === 'rider_assigned' && (
                    <button
                      onClick={() => {
                        setPinModalOrder(o);
                        setError('');
                      }}
                      className="btn-primary text-sm mt-3 w-full"
                    >
                      Verify Rider Pickup PIN
                    </button>
                  )}
                  {o.status === 'picked_up' && <p className="text-xs text-cyan-600 mt-3">Rider en route to customer.</p>}
                  {o.status === 'delivered' && <p className="text-xs text-green-600 mt-3">Delivered ✓</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {orders.length === 0 && <p className="text-neutral-400 text-sm">No orders yet.</p>}

      {pinModalOrder && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center">
            <h3 className="font-semibold mb-2">Enter Rider's Pickup PIN</h3>
            <p className="text-xs text-neutral-400 mb-4">Ask the rider for the 4-digit pickup PIN to confirm handover.</p>
            <input
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-2xl tracking-[0.5em] border border-neutral-200 rounded-xl px-3 py-2 mb-3"
              placeholder="----"
            />
            {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setPinModalOrder(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitPickupPin} className="btn-primary flex-1">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
