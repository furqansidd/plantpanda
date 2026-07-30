import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, DollarSign, Settings, BarChart3, Store, Package, ListOrdered, Radio, Wallet } from 'lucide-react';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import AdminDashboard from './pages/admin/AdminDashboard';
import ApprovalsPage from './pages/admin/ApprovalsPage';
import CommissionPage from './pages/admin/CommissionPage';
import PlatformSettingsPage from './pages/admin/PlatformSettingsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

import BusinessOverview from './pages/business/BusinessOverview';
import InventoryPage from './pages/business/InventoryPage';
import OrdersPipelinePage from './pages/business/OrdersPipelinePage';
import LiveTrackingPage from './pages/business/LiveTrackingPage';
import CashLedgerPage from './pages/business/CashLedgerPage';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/approvals', label: 'Approvals', icon: CheckSquare },
  { to: '/admin/commission', label: 'Commission', icon: DollarSign },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Platform Settings', icon: Settings },
];

const businessNav = [
  { to: '/business', label: 'Overview', icon: Store, end: true },
  { to: '/business/inventory', label: 'Inventory', icon: Package },
  { to: '/business/orders', label: 'Orders', icon: ListOrdered },
  { to: '/business/tracking', label: 'Live Tracking', icon: Radio },
  { to: '/business/cash', label: 'Rider Cash Ledger', icon: Wallet },
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <DashboardLayout title="Super Admin" navItems={adminNav}>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/approvals"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <DashboardLayout title="Approvals" navItems={adminNav}>
              <ApprovalsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/commission"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <DashboardLayout title="Commission (Super Admin only)" navItems={adminNav}>
              <CommissionPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <DashboardLayout title="Analytics" navItems={adminNav}>
              <AnalyticsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <DashboardLayout title="Platform Settings" navItems={adminNav}>
              <PlatformSettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/business"
        element={
          <ProtectedRoute roles={['branch', 'nursery']}>
            <DashboardLayout title="Business Portal" navItems={businessNav}>
              <BusinessOverview />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/inventory"
        element={
          <ProtectedRoute roles={['branch', 'nursery']}>
            <DashboardLayout title="Inventory" navItems={businessNav}>
              <InventoryPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/orders"
        element={
          <ProtectedRoute roles={['branch', 'nursery']}>
            <DashboardLayout title="Orders" navItems={businessNav}>
              <OrdersPipelinePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/tracking"
        element={
          <ProtectedRoute roles={['branch', 'nursery']}>
            <DashboardLayout title="Live Tracking" navItems={businessNav}>
              <LiveTrackingPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/cash"
        element={
          <ProtectedRoute roles={['branch', 'nursery']}>
            <DashboardLayout title="Rider Cash Ledger" navItems={businessNav}>
              <CashLedgerPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
