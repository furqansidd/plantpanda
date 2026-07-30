import { useEffect, useState } from 'react';
import { adminApi, businessApi } from '../../api/endpoints';

export default function CommissionPage() {
  const [summary, setSummary] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [editing, setEditing] = useState(null);
  const [rateInput, setRateInput] = useState('');

  const load = () =>
    adminApi.commissionSummary().then((res) => {
      setSummary(res.data.summary);
      setGrandTotal(res.data.grandTotalCommission);
    });

  useEffect(() => {
    load();
  }, []);

  const saveRate = async (businessId) => {
    await businessApi.setCommission(businessId, parseFloat(rateInput));
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <p className="text-sm text-neutral-500">Grand Total Commission Earned (visible to Super Admin only)</p>
        <p className="text-3xl font-bold text-green-700 mt-1">Rs {grandTotal.toLocaleString()}</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="p-4 font-medium">Business</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Commission Rate</th>
              <th className="p-4 font-medium">Orders</th>
              <th className="p-4 font-medium">Items Value</th>
              <th className="p-4 font-medium">Delivery Fees Paid</th>
              <th className="p-4 font-medium">Commission Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {summary.map((s) => (
              <tr key={s.businessId}>
                <td className="p-4 font-medium">{s.businessName}</td>
                <td className="p-4 capitalize text-neutral-500">{s.businessType}</td>
                <td className="p-4">
                  {editing === s.businessId ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-20 border border-neutral-200 rounded-lg px-2 py-1"
                        value={rateInput}
                        onChange={(e) => setRateInput(e.target.value)}
                      />
                      <button onClick={() => saveRate(s.businessId)} className="text-green-700 text-xs font-semibold">
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditing(s.businessId);
                        setRateInput(s.commissionRate);
                      }}
                      className="underline decoration-dotted"
                    >
                      {s.commissionRate}%
                    </button>
                  )}
                </td>
                <td className="p-4">{s.totalOrders}</td>
                <td className="p-4">Rs {s.totalItemsValue.toLocaleString()}</td>
                <td className="p-4">Rs {s.totalDeliveryFees.toLocaleString()}</td>
                <td className="p-4 font-semibold text-green-700">Rs {s.totalCommission.toLocaleString()}</td>
              </tr>
            ))}
            {summary.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-neutral-400">
                  No delivered orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
