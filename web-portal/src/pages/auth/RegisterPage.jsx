import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'nursery',
    businessName: '',
    address: '',
    lng: '',
    lat: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        business: {
          name: form.businessName,
          address: form.address,
          location: [parseFloat(form.lng), parseFloat(form.lat)],
        },
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm card p-8 text-center">
          <h2 className="font-bold text-lg mb-2">Registration submitted</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Your {form.role} account is pending Super Admin approval. You'll be able to log in and manage
            your inventory once approved.
          </p>
          <Link to="/login" className="btn-primary inline-block">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md card p-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#16a34a' }}>
            <Leaf size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl">PlantPanda</span>
        </div>
        <h2 className="text-center text-neutral-500 text-sm mb-6">Register your branch or nursery</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: 'nursery' }))}
              className={`py-2 rounded-xl text-sm font-medium border ${form.role === 'nursery' ? 'bg-green-50 border-green-400 text-green-700' : 'border-neutral-200'}`}
            >
              Partner Nursery
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: 'branch' }))}
              className={`py-2 rounded-xl text-sm font-medium border ${form.role === 'branch' ? 'bg-green-50 border-green-400 text-green-700' : 'border-neutral-200'}`}
            >
              Internal Branch
            </button>
          </div>

          <input required placeholder="Owner name" value={form.name} onChange={update('name')} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
          <input required type="email" placeholder="Email" value={form.email} onChange={update('email')} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
          <input required placeholder="Phone" value={form.phone} onChange={update('phone')} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
          <input required type="password" placeholder="Password" value={form.password} onChange={update('password')} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />

          <hr className="my-3 border-neutral-100" />

          <input required placeholder="Business name" value={form.businessName} onChange={update('businessName')} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
          <input required placeholder="Address" value={form.address} onChange={update('address')} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" step="any" placeholder="Longitude" value={form.lng} onChange={update('lng')} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
            <input required type="number" step="any" placeholder="Latitude" value={form.lat} onChange={update('lat')} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
            {busy ? 'Submitting...' : 'Submit for approval'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-green-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
