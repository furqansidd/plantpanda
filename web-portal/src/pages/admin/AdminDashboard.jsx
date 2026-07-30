import { useEffect, useState } from 'react';
import { TrendingUp, Package, Sprout, Building2, Bike, Clock } from 'lucide-react';
import { adminApi } from '../../api/endpoints';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.dashboard().then((res) => setData(res.data.dashboard));
  }, []);

  if (!data) return <p className="text-neutral-400">Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Revenue" value={`Rs ${data.totalRevenue.toLocaleString()}`} accent="bg-green-50 text-green-600" />
        <StatCard icon={Package} label="Total Orders" value={data.orderCount.toLocaleString()} accent="bg-blue-50 text-blue-600" />
        <StatCard icon={Sprout} label="Active Nurseries" value={data.activeNurseries} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Building2} label="Active Branches" value={data.activeBranches} accent="bg-purple-50 text-purple-600" />
        <StatCard icon={Bike} label="Active Riders" value={data.activeRiders} accent="bg-orange-50 text-orange-600" />
        <StatCard icon={Clock} label="Pending Approvals" value={data.pendingApprovals} accent="bg-amber-50 text-amber-600" />
      </div>

      <div className="card p-5">
        <p className="text-sm text-neutral-500 mb-1">Platform Commission Earned (Superadmin only)</p>
        <p className="text-3xl font-bold text-green-700">Rs {data.totalCommissionEarned.toLocaleString()}</p>
        <p className="text-xs text-neutral-400 mt-1">
          This figure and its per-business breakdown are never shown to branch/nursery portals.
        </p>
      </div>
    </div>
  );
}
