import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminApi } from '../../api/endpoints';

export default function AnalyticsPage() {
  const [byType, setByType] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);

  useEffect(() => {
    adminApi.analytics().then((res) => {
      setByType(res.data.byType);
      setDailyTrend(res.data.dailyTrend);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {byType.map((t) => (
          <div key={t._id} className="card p-5">
            <p className="text-sm text-neutral-500 capitalize">{t._id} Performance</p>
            <p className="text-2xl font-bold mt-1">Rs {t.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-neutral-400 mt-1">
              {t.totalOrders} orders • Avg order value Rs {Math.round(t.avgOrderValue).toLocaleString()}
            </p>
          </div>
        ))}
        {byType.length === 0 && <p className="text-neutral-400">No delivered orders yet to break down.</p>}
      </div>

      <div className="card p-5">
        <p className="font-semibold mb-4">Revenue Trend (last 30 days with deliveries)</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
