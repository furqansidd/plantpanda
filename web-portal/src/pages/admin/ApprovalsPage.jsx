import { useEffect, useState } from 'react';
import { businessApi, adminApi } from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';

export default function ApprovalsPage() {
  const [businesses, setBusinesses] = useState([]);
  const [riders, setRiders] = useState([]);
  const [tab, setTab] = useState('businesses');

  const load = async () => {
    const [bRes, rRes] = await Promise.all([
      businessApi.list({ status: 'pending' }),
      adminApi.pendingRiders(),
    ]);
    setBusinesses(bRes.data.businesses);
    setRiders(rRes.data.riders);
  };

  useEffect(() => {
    load();
  }, []);

  const handleBusinessDecision = async (businessId, status) => {
    await businessApi.updateStatus(businessId, status);
    load();
  };

  const handleRiderDecision = async (userId, approve) => {
    await adminApi.approveRider(userId, approve);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('businesses')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'businesses' ? 'bg-green-600 text-white' : 'bg-white border border-neutral-200'}`}
        >
          Branches & Nurseries ({businesses.length})
        </button>
        <button
          onClick={() => setTab('riders')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'riders' ? 'bg-green-600 text-white' : 'bg-white border border-neutral-200'}`}
        >
          Riders ({riders.length})
        </button>
      </div>

      {tab === 'businesses' && (
        <div className="card divide-y divide-neutral-100">
          {businesses.length === 0 && <p className="p-6 text-sm text-neutral-400">No pending business approvals.</p>}
          {businesses.map((b) => (
            <div key={b._id} className="p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold">{b.name}</p>
                <p className="text-sm text-neutral-500">{b.address}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Type: {b.type} • Owner: {b.userId?.name} ({b.userId?.email})
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <StatusBadge status={b.status} />
                <button onClick={() => handleBusinessDecision(b._id, 'approved')} className="btn-primary text-sm">
                  Approve
                </button>
                <button onClick={() => handleBusinessDecision(b._id, 'rejected')} className="btn-secondary text-sm">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'riders' && (
        <div className="card divide-y divide-neutral-100">
          {riders.length === 0 && <p className="p-6 text-sm text-neutral-400">No pending rider approvals.</p>}
          {riders.map((r) => (
            <div key={r._id} className="p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-neutral-500">{r.email} • {r.phone}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Vehicle: {r.vehicleType || '—'} {r.vehicleNumber ? `(${r.vehicleNumber})` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRiderDecision(r._id, true)} className="btn-primary text-sm">
                  Approve
                </button>
                <button onClick={() => handleRiderDecision(r._id, false)} className="btn-secondary text-sm">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
