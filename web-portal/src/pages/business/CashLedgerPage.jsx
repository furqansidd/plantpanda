import { useEffect, useState } from 'react';
import { AlertTriangle, History } from 'lucide-react';
import { ledgerApi } from '../../api/endpoints';

export default function CashLedgerPage() {
  const [ledgers, setLedgers] = useState([]);
  const [settleModal, setSettleModal] = useState(null); // ledger object being settled
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [historyLedger, setHistoryLedger] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const load = () => ledgerApi.list().then((res) => setLedgers(res.data.ledgers));

  useEffect(() => {
    load();
  }, []);

  const openSettle = (ledger) => {
    setSettleModal(ledger);
    setAmount('');
    setError('');
  };

  const submitSettle = async () => {
    setError('');
    try {
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) throw new Error('Enter a valid amount');
      await ledgerApi.settle(settleModal._id, amt);
      setSettleModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record payment');
    }
  };

  const openHistory = async (ledger) => {
    setHistoryLedger(ledger);
    const { data } = await ledgerApi.transactions(ledger._id);
    setTransactions(data.transactions);
  };

  const totalOutstanding = ledgers.reduce((sum, l) => sum + l.outstandingAmount, 0);

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <p className="text-sm text-neutral-500">Total Cash Receivable from Riders</p>
        <p className="text-2xl font-bold mt-1">Rs {totalOutstanding.toLocaleString()}</p>
        <p className="text-xs text-neutral-400 mt-1">
          This is only the product-value (COD) portion collected by riders on your behalf — rider delivery
          earnings and platform commission are separate and never included here.
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="p-4 font-medium">Rider</th>
              <th className="p-4 font-medium">Outstanding</th>
              <th className="p-4 font-medium">Total Collected</th>
              <th className="p-4 font-medium">Total Settled</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {ledgers.map((l) => (
              <tr key={l._id}>
                <td className="p-4">
                  <p className="font-medium">{l.riderId?.name}</p>
                  <p className="text-xs text-neutral-400">{l.riderId?.phone}</p>
                </td>
                <td className={`p-4 font-semibold ${l.outstandingAmount > 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                  Rs {l.outstandingAmount.toLocaleString()}
                </td>
                <td className="p-4 text-neutral-500">Rs {l.totalCollected.toLocaleString()}</td>
                <td className="p-4 text-neutral-500">Rs {l.totalSettled.toLocaleString()}</td>
                <td className="p-4">
                  {l.isBlocked ? (
                    <span className="badge bg-red-100 text-red-700">
                      <AlertTriangle size={12} /> Blocked
                    </span>
                  ) : (
                    <span className="badge bg-green-100 text-green-700">OK</span>
                  )}
                </td>
                <td className="p-4 flex gap-2 justify-end">
                  <button onClick={() => openHistory(l)} className="btn-secondary text-xs flex items-center gap-1">
                    <History size={13} /> History
                  </button>
                  {l.outstandingAmount > 0 && (
                    <button onClick={() => openSettle(l)} className="btn-primary text-xs">
                      Record Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {ledgers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-neutral-400">
                  No riders have collected cash on your behalf yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {settleModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold mb-1">Record Payment — {settleModal.riderId?.name}</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Outstanding: Rs {settleModal.outstandingAmount.toLocaleString()}
            </p>
            <input
              type="number"
              autoFocus
              placeholder="Amount received (e.g. 500)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 mb-2"
            />
            {amount && !isNaN(parseFloat(amount)) && (
              <p className="text-xs text-neutral-500 mb-2">
                Rs {parseFloat(amount).toLocaleString()} received, Rs{' '}
                {Math.max(settleModal.outstandingAmount - parseFloat(amount), 0).toLocaleString()} left —
                the rider will see this exact same breakdown on their dashboard.
              </p>
            )}
            {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => setSettleModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitSettle} className="btn-primary flex-1">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {historyLedger && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">History — {historyLedger.riderId?.name}</h3>
              <button onClick={() => setHistoryLedger(null)} className="text-neutral-400 text-sm">Close</button>
            </div>
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t._id} className="flex justify-between text-sm border-b border-neutral-50 pb-2">
                  <div>
                    <p className={`font-medium ${t.type === 'collection' ? 'text-red-600' : 'text-green-600'}`}>
                      {t.type === 'collection' ? '+ Collected' : '− Settled'} Rs {t.amount}
                    </p>
                    <p className="text-xs text-neutral-400">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-neutral-400">Balance: Rs {t.balanceAfter}</p>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-sm text-neutral-400">No transactions yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
