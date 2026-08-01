import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}
dns.setDefaultResultOrder('ipv4first');

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[db] MongoDB connected');
  } catch (err) {
    console.error('[db] MongoDB connection error:', err);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });
}
