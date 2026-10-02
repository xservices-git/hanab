import { createServer } from 'http';
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import { Server } from 'socket.io';
import { EventEmitter } from 'events';
import * as jose from 'jose';
import { PrismaClient, type UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// In-process pub/sub (replaces Redis in local dev). Worker is single instance.
const bus = new EventEmitter();
bus.setMaxListeners(1000);
const fakeRedis: any = {
  subscribe(channel: string, cb?: (err: Error | null) => void) { cb?.(null); return Promise.resolve(); },
  on(event: 'message', handler: (channel: string, msg: string) => void) {
    if (event === 'message') bus.on('notifications', (msg: string) => handler('notifications', msg));
    return this;
  },
  disconnect() { bus.removeAllListeners(); },
  publish(channel: string, msg: string) { bus.emit(channel, msg); return 1; },
};
const redis = fakeRedis;

const httpServer = createServer();
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'vay365-secret-key-change-in-production');
const wireSecret = createHash('sha256').update(process.env.WS_WIRE_SECRET || process.env.JWT_SECRET || 'dev-ws-secret-change-me').digest();

const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true },
  path: '/ws',
  maxHttpBufferSize: 64 * 1024,
  transports: ['websocket'],
});

type SocketUser = { id: string; role: UserRole; email?: string | null; phone?: string | null };

function seal(event: string, payload: unknown): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', wireSecret, iv);
  const body = Buffer.from(JSON.stringify({ v: 1, event, ts: Date.now(), nonce: randomBytes(12).toString('base64url'), payload }));
  const encrypted = Buffer.concat([cipher.update(body), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([1]), iv, tag, encrypted]);
}

function open(packet: Buffer) {
  if (!Buffer.isBuffer(packet) || packet.length < 30 || packet[0] !== 1) throw new Error('Invalid packet');
  const iv = packet.subarray(1, 13);
  const tag = packet.subarray(13, 29);
  const encrypted = packet.subarray(29);
  const decipher = createDecipheriv('aes-256-gcm', wireSecret, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
}

function sendEncrypted(socketOrRoom: any, event: string, payload: unknown) {
  socketOrRoom.emit('bin', seal(event, payload));
}

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new Error('Authentication required'));
  try {
    const { payload } = await jose.jwtVerify(token, jwtSecret);
    if (!payload.id || !payload.role) return next(new Error('Invalid token'));
    socket.data.user = { id: payload.id, role: payload.role, email: payload.email, phone: payload.phone } as SocketUser;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user as SocketUser;
  socket.join(`user:${user.id}`);
  if (user.role === 'admin') socket.join('role:admin');
  if (user.role === 'agent' || user.role === 'admin') socket.join('role:staff');
  if (user.role === 'agent') socket.join(`agent:${user.id}`);

  sendEncrypted(socket, 'ws:ready', { userId: user.id, role: user.role });

  socket.on('bin', async (packet: Buffer) => {
    try {
      const msg = open(packet);
      if (msg.event === 'loan:watch' && msg.payload?.loanId) {
        const loan = await prisma.loan.findUnique({ where: { id: msg.payload.loanId }, select: { userId: true, assignedAgentId: true } });
        const allowed = user.role === 'admin' || loan?.userId === user.id || loan?.assignedAgentId === user.id;
        if (!allowed) throw new Error('Forbidden');
        socket.join(`loan:${msg.payload.loanId}`);
        sendEncrypted(socket, 'loan:watching', { loanId: msg.payload.loanId });
      }
    } catch (e: any) {
      sendEncrypted(socket, 'ws:error', { message: e.message || 'Bad packet' });
    }
  });
});

redis.subscribe('notifications', (err) => {
  if (err) console.error('Redis subscribe error:', err);
});

redis.on('message', (_channel, message) => {
  try {
    const data = JSON.parse(message);
    const room = data.room || `user:${data.userId}`;
    sendEncrypted(io.to(room), data.event || 'notification:new', data.payload);
  } catch (e) {
    console.error('Bad redis message', e);
  }
});

const PORT = parseInt(process.env.PORT || '3001');
httpServer.listen(PORT, () => console.log(`Worker running on port ${PORT}`));

process.on('SIGTERM', async () => {
  io.close();
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});