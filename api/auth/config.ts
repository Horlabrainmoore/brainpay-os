import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createThirdwebClient } from 'thirdweb';
import { createAuth } from 'thirdweb/auth';
import { privateKeyToAccount } from 'thirdweb/wallets';

export function getAuth() {
  const secretKey = process.env.THIRDWEB_SECRET_KEY?.trim();
  const privateKey = process.env.THIRDWEB_AUTH_PRIVATE_KEY?.trim();
  const domain = process.env.THIRDWEB_AUTH_DOMAIN?.trim();

  if (!secretKey || !privateKey || !domain) {
    throw new Error('Thirdweb server authentication is not configured.');
  }

  const client = createThirdwebClient({ secretKey });
  const adminAccount = privateKeyToAccount({ client, privateKey });
  return createAuth({ domain, client, adminAccount });
}

export function readJwtCookie(request: VercelRequest): string | null {
  const raw = request.headers.cookie;
  if (!raw) return null;
  const match = raw.split(';').map((value) => value.trim()).find((value) => value.startsWith('thirdweb_auth='));
  return match ? decodeURIComponent(match.slice('thirdweb_auth='.length)) : null;
}

export function setJwtCookie(response: VercelResponse, jwt: string): void {
  response.setHeader('Set-Cookie', `thirdweb_auth=${encodeURIComponent(jwt)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900`);
}

export function clearJwtCookie(response: VercelResponse): void {
  response.setHeader('Set-Cookie', 'thirdweb_auth=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
}
