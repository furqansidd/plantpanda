import { NavLink, useNavigate } from 'react-router-dom';
import { Leaf, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ title, navItems, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-neutral-200">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center" style={{ backgroundColor: '#16a34a' }}>
            <Leaf size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">PlantPanda</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-50 text-green-700' : 'text-neutral-600 hover:bg-neutral-50'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-200">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center px-6">
          <h1 className="text-lg font-semibold">{title}</h1>
        </header>
        <main className="flex-1 p-6 overflow-y-auto bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}
