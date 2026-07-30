import { useEffect, useState } from 'react';
import { businessApi } from '../../api/endpoints';

const FIELDS = [
  { key: 'perKmRate', label: 'Rider Rate per KM (Rs)', hint: 'Drives rider deliveryFee = baseFee + distanceKm × this rate' },
  { key: 'baseFee', label: 'Base Delivery Fee (Rs)', hint: 'Flat amount added to every delivery' },
  { key: 'codBlockThreshold', label: 'Global COD Block Threshold (Rs)', hint: 'Rider is blocked from ALL orders once debt to any single business reaches this' },
  { key: 'defaultCommissionRate', label: 'Default Commission Rate (%)', hint: 'Applied to newly approved businesses' },
  { key: 'dispatchInitialRadiusKm', label: 'Initial Dispatch Radius (km)' },
  { key: 'dispatchExpandedRadiusKm', label: 'Expanded Dispatch Radius (km)' },
  { key: 'dispatchEscalationSeconds', label: 'Escalation Timeout (seconds)' },
];

export default function PlatformSettingsPage() {
  const [config, setConfig] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    businessApi.getPlatformConfig().then((res) => setConfig(res.data.config));
  }, []);

  const update = (key) => (e) => setConfig((c) => ({ ...c, [key]: e.target.value }));

  const save = async () => {
    const payload = {};
    for (const f of FIELDS) payload[f.key] = parseFloat(config[f.key]);
    const { data } = await businessApi.updatePlatformConfig(payload);
    setConfig(data.config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!config) return <p className="text-neutral-400">Loading settings...</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card p-6 space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="text-sm font-medium text-neutral-700">{f.label}</label>
            {f.hint && <p className="text-xs text-neutral-400 mb-1">{f.hint}</p>}
            <input
              type="number"
              value={config[f.key]}
              onChange={update(f.key)}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 mt-1"
            />
          </div>
        ))}
        <button onClick={save} className="btn-primary">
          {saved ? 'Saved ✓' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
