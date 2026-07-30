import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';
import { attachSocketServer, claimOrder, updateRiderLocation } from '../services/dispatchService';

let io: SocketIOServer;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });

  attachSocketServer(io);

  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        parseCookie(socket.handshake.headers.cookie || '', env.COOKIE_NAME);
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyToken(token);
      const user = await User.findById(payload.userId);
      if (!user) return next(new Error('User not found'));

      (socket as any).user = user;
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as InstanceType<typeof User>;
    console.log(`[socket] connected: ${user._id} (${user.role})`);

    // Join role-appropriate rooms so controllers can target broadcasts.
    socket.join(`user:${user._id}`);
    if (user.role === 'customer') socket.join(`customer:${user._id}`);
    if (user.role === 'rider') socket.join(`rider:${user._id}`);
    if (user.role === 'branch' || user.role === 'nursery') {
      // business room is joined by businessId, resolved client-side after fetching /businesses/me
      socket.on('business:join', (businessId: string) => socket.join(`business:${businessId}`));
    }
    if (user.role === 'super_admin') socket.join('admin');

    socket.on('order:join', (orderId: string) => socket.join(`order:${orderId}`));
    socket.on('order:leave', (orderId: string) => socket.leave(`order:${orderId}`));

    // Rider accepting an order via socket (alternative to REST endpoint) - same first-come-first-served lock.
    socket.on('order:accept', async (orderId: string, ack?: (res: any) => void) => {
      if (user.role !== 'rider') {
        return ack?.({ success: false, message: 'Only riders can accept orders' });
      }
      const result = await claimOrder(orderId, user._id.toString());
      ack?.(result);
      if (!result.success) {
        socket.emit('order:claimFailed', { orderId, reason: result.reason });
      }
    });

    // Live GPS stream while a rider is on an active delivery.
    socket.on('rider:location', async (data: { lng: number; lat: number; activeOrderId?: string }) => {
      if (user.role !== 'rider') return;
      await updateRiderLocation(user._id.toString(), data.lng, data.lat, data.activeOrderId);
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${user._id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.io server not initialized yet');
  return io;
}

function parseCookie(cookieHeader: string, name: string): string | undefined {
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}
