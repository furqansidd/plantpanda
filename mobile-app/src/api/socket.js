import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { getToken } from './client';

const SOCKET_URL = Constants.expoConfig?.extra?.socketUrl || 'http://localhost:5000';

let globalSocketInstance = null;

export async function connectSocket() {
  const token = await getToken();
  if (!token) return null;

  if (globalSocketInstance && globalSocketInstance.connected) return globalSocketInstance;
  if (globalSocketInstance) globalSocketInstance.disconnect();

  globalSocketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return globalSocketInstance;
}

export function getActiveSocket() {
  return globalSocketInstance;
}

export function getSocket() {
  return globalSocketInstance;
}

export function disconnectSocket() {
  if (globalSocketInstance?.connected) globalSocketInstance.disconnect();
  globalSocketInstance = null;
}
