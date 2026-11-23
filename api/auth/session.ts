import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuth, readJwtCookie } from './config';

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const jwt = readJwtCookie(request);
  if (!jwt) {
    response.status(401).json({ authenticated: false });
    return;
  }

  try {
    const auth = getAuth();
    const result = await auth.verifyJWT({ jwt });
    if (!result.valid) {
      response.status(401).json({ authenticated: false });
      return;
    }

    response.setHeader('Cache-Control', 'no-store');
    response.status(200).json({ authenticated: true });
  } catch {
    response.status(401).json({ authenticated: false });
  }
}
