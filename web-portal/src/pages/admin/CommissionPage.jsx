import { useEffect, useState } from 'react';
import { adminApi, businessApi } from '../../api/endpoints';
import { Percent, Building2, Store, Check, Edit2, X } from 'lucide-react';

export default function CommissionPage() {
  const [summary, setSummary] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [editing, setEditing] = useState(null);
  const [rateInput, setRateInput] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'nursery' | 'branch'
  const [toastMessage, setToastMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    adminApi.commissionSummary().then((res) => {
      setSummary(res.data.summary || []);
      setGrandTotal(res.data.grandTotalCommission || 0);
    });

  useEffect(() => {
    load();
  }, []);

  const saveRate = async (businessId, customRate) => {
    const valToSave = customRate !== undefined ? customRate : parseFloat(rateInput);
    if (isNaN(valToSave) || valToSave < 0 || valToSave > 100) {
      alert('Commission rate must be a number between 0% and 100%.');
      return;
    }

    setSaving(true);
    try {
      await businessApi.setCommission(businessId, valToSave);
      setEditing(null);
      setToastMessage('Commission rate updated successfully!');
      setTimeout(() => setToastMessage(''), 3000);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update commission rate');
    } finally {
      setSaving(false);
    }
  };

  const filteredSummary = summary.filter((s) => {
    if (filterType === 'all') return true;
    return s.businessType === filterType;
  });

  const zeroCommissionCount = summary.filter((s) => s.commissionRate === 0).length;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Check size={18} />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-white/80 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-l-green-600">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Grand Total Commission</p>
          <p className="text-3xl font-extrabold text-green-700 mt-2">Rs {grandTotal.toLocaleString()}</p>
          <p className="text-xs text-neutral-400 mt-1">Earned platform cut (Super Admin only)</p>
        </div>

        <div className="card p-5 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Registered Businesses</p>
          <p className="text-3xl font-extrabold text-neutral-800 mt-2">{summary.length}</p>
          <p className="text-xs text-neutral-400 mt-1">
            {summary.filter((s) => s.businessType === 'nursery').length} Nurseries •{' '}
            {summary.filter((s) => s.businessType === 'branch').length} Branches
          </p>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">0% Commission Businesses</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{zeroCommissionCount}</p>
          <p className="text-xs text-neutral-400 mt-1">Zero-fee branch/nursery partners</p>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
              <Percent className="text-green-600" size={20} />
              Per-Business Commission Management
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Set custom commission percentages (0% to 100%) individually for each branch or nursery.
            </p>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'all' ? 'bg-white text-neutral-900 shadow-sm font-semibold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All ({summary.length})
            </button>
            <button
              onClick={() => setFilterType('nursery')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'nursery' ? 'bg-white text-neutral-900 shadow-sm font-semibold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Nurseries ({summary.filter((s) => s.businessType === 'nursery').length})
            </button>
            <button
              onClick={() => setFilterType('branch')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'branch' ? 'bg-white text-neutral-900 shadow-sm font-semibold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Branches ({summary.filter((s) => s.businessType === 'branch').length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-left">
              <tr>
                <th className="p-3.5 font-semibold">Business</th>
                <th className="p-3.5 font-semibold">Type</th>
                <th className="p-3.5 font-semibold">Custom Commission Rate</th>
                <th className="p-3.5 font-semibold">Orders</th>
                <th className="p-3.5 font-semibold">Items Value</th>
                <th className="p-3.5 font-semibold">Delivery Fees</th>
                <th className="p-3.5 font-semibold">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredSummary.map((s) => {
                const isEditing = editing === s.businessId;

                return (
                  <tr key={s.businessId} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Business Name */}
                    <td className="p-3.5 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        {s.businessType === 'nursery' ? (
                          <Store size={16} className="text-emerald-600" />
                        ) : (
                          <Building2 size={16} className="text-blue-600" />
                        )}
                        <span>{s.businessName}</span>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          s.businessType === 'nursery'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {s.businessType}
                      </span>
                    </td>

                    {/* Commission Rate (Editable) */}
                    <td className="p-3.5">
                      {isEditing ? (
                        <div className="space-y-2 max-w-xs">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              disabled={saving}
                              className="w-24 border border-green-300 rounded-lg px-2.5 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                              value={rateInput}
                              onChange={(e) => setRateInput(e.target.value)}
                              placeholder="0"
                            />
                            <span className="text-sm font-bold text-neutral-600">%</span>

                            <button
                              onClick={() => saveRate(s.businessId)}
                              disabled={saving}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                            >
                              {saving ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="text-neutral-400 hover:text-neutral-600 p-1"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Quick Preset Chips */}
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-neutral-400 font-medium">Quick:</span>
                            {[0, 5, 10, 15, 20].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setRateInput(preset.toString());
                                  saveRate(s.businessId, preset);
                                }}
                                className="px-2 py-0.5 bg-neutral-100 hover:bg-green-100 hover:text-green-700 rounded text-[11px] font-bold text-neutral-600 transition-colors"
                              >
                                {preset}%
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditing(s.businessId);
                              setRateInput(s.commissionRate.toString());
                            }}
                            className="group inline-flex items-center gap-1.5 focus:outline-none"
                            title="Click to change commission rate"
                          >
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-extrabold transition-all group-hover:scale-105 ${
                                s.commissionRate === 0
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-green-50 text-green-800 border border-green-200'
                              }`}
                            >
                              {s.commissionRate === 0 ? '0% (Free)' : `${s.commissionRate}%`}
                            </span>
                            <Edit2 size={14} className="text-neutral-400 group-hover:text-green-600 transition-colors" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Stats */}
                    <td className="p-3.5 text-neutral-700 font-medium">{s.totalOrders}</td>
                    <td className="p-3.5 text-neutral-700">Rs {(s.totalItemsValue || 0).toLocaleString()}</td>
                    <td className="p-3.5 text-neutral-700">Rs {(s.totalDeliveryFees || 0).toLocaleString()}</td>
                    <td className="p-3.5 font-bold text-green-700">Rs {(s.totalCommission || 0).toLocaleString()}</td>
                  </tr>
                );
              })}

              {filteredSummary.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    No businesses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
