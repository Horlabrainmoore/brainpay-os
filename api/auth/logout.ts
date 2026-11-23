import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearJwtCookie } from './config';

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }
  clearJwtCookie(response);
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({ authenticated: false });
}
