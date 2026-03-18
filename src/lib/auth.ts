import { cookies as cookiesFn } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE_NAME = 'session';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string | null;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET);
}

export async function verifySession(
  cookies: ReadonlyRequestCookies
): Promise<SessionPayload | null> {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  };
}
