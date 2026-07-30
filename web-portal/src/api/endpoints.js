import api from './client';

// ---- Auth ----
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ---- Business (superadmin + self-service) ----
export const businessApi = {
  list: (params) => api.get('/businesses', { params }),
  updateStatus: (businessId, status) => api.patch(`/businesses/${businessId}/status`, { status }),
  setCommission: (businessId, commissionRate) =>
    api.patch(`/businesses/${businessId}/commission`, { commissionRate }),
  getPlatformConfig: () => api.get('/businesses/platform-config'),
  updatePlatformConfig: (data) => api.patch('/businesses/platform-config', data),
  getMine: () => api.get('/businesses/me'),
  updateMine: (data) => api.patch('/businesses/me', data),
};

// ---- Products ----
export const productApi = {
  browse: (params) => api.get('/products/browse', { params }),
  mine: () => api.get('/products/mine'),
  create: (data) => api.post('/products', data),
  update: (productId, data) => api.patch(`/products/${productId}`, data),
  toggle: (productId) => api.patch(`/products/${productId}/toggle`),
  remove: (productId) => api.delete(`/products/${productId}`),
};

// ---- Orders ----
export const orderApi = {
  create: (data) => api.post('/orders', data),
  mineAsCustomer: () => api.get('/orders/mine/customer'),
  mineAsBusiness: (params) => api.get('/orders/mine/business', { params }),
  mineAsRider: () => api.get('/orders/mine/rider'),
  accept: (orderId) => api.patch(`/orders/${orderId}/accept`),
  markReady: (orderId) => api.patch(`/orders/${orderId}/ready`),
  verifyPickupPIN: (orderId, pin) => api.post(`/orders/${orderId}/verify-pickup-pin`, { pin }),
  verifyDeliveryPIN: (orderId, pin, proofOfDeliveryUrl) =>
    api.post(`/orders/${orderId}/verify-delivery-pin`, { pin, proofOfDeliveryUrl }),
  cancel: (orderId, reason) => api.patch(`/orders/${orderId}/cancel`, { reason }),
  getById: (orderId) => api.get(`/orders/${orderId}`),
};

// ---- Rider ----
export const riderApi = {
  switchActiveRole: (activeRole) => api.patch('/riders/active-role', { activeRole }),
  goOnline: (lng, lat) => api.post('/riders/online', { lng, lat }),
  goOffline: () => api.post('/riders/offline'),
  pingLocation: (lng, lat, activeOrderId) => api.post('/riders/location', { lng, lat, activeOrderId }),
  acceptOrder: (orderId) => api.post(`/riders/orders/${orderId}/accept`),
  earnings: () => api.get('/riders/earnings'),
  ledgers: () => api.get('/riders/ledgers'),
  ledgerTransactions: (ledgerId) => api.get(`/riders/ledgers/${ledgerId}/transactions`),
};

// ---- Ledger (business-side settlement) ----
export const ledgerApi = {
  list: () => api.get('/ledger'),
  transactions: (ledgerId) => api.get(`/ledger/${ledgerId}/transactions`),
  settle: (ledgerId, amountReceived) => api.post(`/ledger/${ledgerId}/settle`, { amountReceived }),
};

// ---- Admin ----
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  commissionSummary: () => api.get('/admin/commission-summary'),
  analytics: () => api.get('/admin/analytics'),
  pendingRiders: () => api.get('/admin/riders/pending'),
  approveRider: (userId, approve) => api.patch(`/admin/riders/${userId}/approve`, { approve }),
};
