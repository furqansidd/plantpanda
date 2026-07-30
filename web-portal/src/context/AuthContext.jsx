import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';
import { connectSocket, disconnectSocket } from '../api/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.user);
      connectSocket();
    } catch {
      setUser(null);
      localStorage.removeItem('pp_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    if (data.token) {
      localStorage.setItem('pp_token', data.token);
    }
    setUser(data.user);
    connectSocket();
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    if (data.token) {
      localStorage.setItem('pp_token', data.token);
    }
    setUser(data.user);
    connectSocket();
    return data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore errors on logout
    }
    localStorage.removeItem('pp_token');
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
