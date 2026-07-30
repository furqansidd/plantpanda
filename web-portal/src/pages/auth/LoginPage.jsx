import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      if (user.role === 'super_admin') navigate('/admin');
      else if (user.role === 'branch' || user.role === 'nursery') navigate('/business');
      else navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm card p-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#16a34a' }}>
            <Leaf size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl">PlantPanda</span>
        </div>
        <h2 className="text-center text-neutral-500 text-sm mb-6">Sign in to your portal</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          New business partner?{' '}
          <Link to="/register" className="text-green-700 font-medium">
            Register here
          </Link>
        </p>

        <div className="mt-6 text-xs text-neutral-400 border-t border-neutral-100 pt-4">
          <p className="font-semibold mb-1">Demo accounts (after running seed):</p>
          <p>Super Admin: admin@plantpanda.com / admin1234</p>
          <p>Nursery: nursery@plantpanda.com / nursery1234</p>
        </div>
      </div>
    </div>
  );
}
