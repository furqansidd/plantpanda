import { useEffect, useState } from 'react';
import { businessApi, orderApi } from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';

export default function BusinessOverview() {
  const [business, setBusiness] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    businessApi.getMine().then((res) => setBusiness(res.data.business));
    orderApi.mineAsBusiness().then((res) => setOrders(res.data.orders.slice(0, 8)));
  }, []);

  const toggleOpen = async () => {
    const { data } = await businessApi.updateMine({ isOpen: !business.isOpen });
    setBusiness(data.business);
  };

  if (!business) return <p className="text-neutral-400">Loading...</p>;

  const activeCount = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
  const deliveredToday = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="space-y-6">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-lg">{business.name}</p>
          <p className="text-sm text-neutral-500">{business.address}</p>
          {business.status === 'pending' && (
            <p className="text-xs text-amber-600 mt-1 font-medium">Your account is pending Super Admin approval.</p>
          )}
        </div>
        <button
          onClick={toggleOpen}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${business.isOpen ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}
        >
          {business.isOpen ? 'Open for orders' : 'Closed'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm text-neutral-500">Active Orders</p>
          <p className="text-2xl font-bold mt-1">{activeCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-neutral-500">Recently Delivered</p>
          <p className="text-2xl font-bold mt-1">{deliveredToday}</p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-neutral-100 font-semibold">Recent Orders</div>
        <div className="divide-y divide-neutral-100">
          {orders.map((o) => (
            <div key={o._id} className="p-4 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">Order #{o._id.slice(-6)}</p>
                <p className="text-neutral-400 text-xs">{o.items.length} item(s) • Rs {o.itemsTotal}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>
          ))}
          {orders.length === 0 && <p className="p-6 text-sm text-neutral-400">No orders yet.</p>}
        </div>
      </div>
    </div>
  );
}
