import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';
import { saveToken, clearToken, getToken } from '../api/client';
import { connectSocket, disconnectSocket } from '../api/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await authApi.me();
      setUser(data.user);
      await connectSocket();
    } catch {
      await clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    await saveToken(data.token);
    setUser(data.user);
    await connectSocket();
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    await saveToken(data.token);
    setUser(data.user);
    await connectSocket();
    return data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    }
    await clearToken();
    disconnectSocket();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await authApi.me();
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
