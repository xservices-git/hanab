import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/signup',
];
const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/register'];
const ADMIN_PATHS = ['/admin'];
const STAFF_PATHS = ['/agent'];
const ADMIN_API_PATHS = ['/api/admin'];
const STAFF_API_PATHS = ['/api/agent'];

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const isApi = pathname.startsWith('/api/');

  if (isRateLimited(ip)) {
    return isApi ? jsonError(429, 'Too Many Requests') : new NextResponse('Too Many Requests', { status: 429 });
  }

  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!isApi && (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === '/')) return NextResponse.next();

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return isApi ? jsonError(401, 'Unauthorized') : NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    if (isApi) return jsonError(401, 'Unauthorized');
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('token');
    return res;
  }

  const role = String(payload.role);
  const needsAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p)) || ADMIN_API_PATHS.some((p) => pathname.startsWith(p));
  const needsStaff = STAFF_PATHS.some((p) => pathname.startsWith(p)) || STAFF_API_PATHS.some((p) => pathname.startsWith(p));

  if (needsAdmin && !['admin', 'agent'].includes(role)) {
    return isApi ? jsonError(403, 'Forbidden') : NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (needsStaff && !['admin', 'agent'].includes(role)) {
    return isApi ? jsonError(403, 'Forbidden') : NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'] };
