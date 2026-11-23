import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuth } from './config';

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const address = typeof request.body?.address === 'string' ? request.body.address.trim() : '';
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    response.status(400).json({ error: 'A valid wallet address is required.' });
    return;
  }

  try {
    const payload = await getAuth().generatePayload({ address });
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).json(payload);
  } catch (error) {
    response.status(503).json({ error: error instanceof Error ? error.message : 'Authentication is unavailable.' });
  }
}
