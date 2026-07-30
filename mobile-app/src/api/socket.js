import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { getToken } from './client';

const SOCKET_URL = Constants.expoConfig?.extra?.socketUrl || 'http://localhost:5000';

let socket = null;

export async function connectSocket() {
  const token = await getToken();
  if (!token) return null;

  if (socket) socket.disconnect();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
  socket = null;
}
