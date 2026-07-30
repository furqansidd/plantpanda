import api from './client';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const productApi = {
  browse: (params) => api.get('/products/browse', { params }),
};

export const orderApi = {
  create: (data) => api.post('/orders', data),
  mineAsCustomer: () => api.get('/orders/mine/customer'),
  mineAsRider: () => api.get('/orders/mine/rider'),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  verifyDeliveryPIN: (orderId, pin, proofOfDeliveryUrl) =>
    api.post(`/orders/${orderId}/verify-delivery-pin`, { pin, proofOfDeliveryUrl }),
  cancel: (orderId, reason) => api.patch(`/orders/${orderId}/cancel`, { reason }),
};

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
