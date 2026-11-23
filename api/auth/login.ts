import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuth, setJwtCookie } from './config';

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const payload = request.body?.payload;
  const signature = typeof request.body?.signature === 'string' ? request.body.signature : '';
  if (!payload || !signature) {
    response.status(400).json({ error: 'Signed login payload and signature are required.' });
    return;
  }

  try {
    const auth = getAuth();
    const verifiedPayload = await auth.verifyPayload({ payload, signature });
    if (!verifiedPayload) {
      response.status(401).json({ error: 'Invalid wallet signature.' });
      return;
    }

    const jwt = await auth.generateJWT({ payload: verifiedPayload });
    setJwtCookie(response, jwt);
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).json({ authenticated: true });
  } catch {
    response.status(401).json({ error: 'Wallet signature verification failed.' });
  }
}
