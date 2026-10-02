import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '@vay365/shared';

export default async function handler(req: NextApiRequest, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  res.setHeader('Set-Cookie', ['token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0']);
  return res.status(200).json({ ok: true, data: { message: 'Logged out' } });
}
