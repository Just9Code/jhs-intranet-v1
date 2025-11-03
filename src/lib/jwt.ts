import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jhs-secret-key-change-in-production-2024'
);

const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION = '7d'; // 7 days

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a secure JWT token
 */
export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  try {
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION)
      .sign(JWT_SECRET);

    return token;
  } catch (error) {
    console.error('🔴 [JWT] Error generating token:', error);
    throw new Error('Failed to generate token');
  }
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('🔴 [JWT] Token verification failed:', error);
    return null;
  }
}

/**
 * Get token from cookies or Authorization header
 */
export function getTokenFromRequest(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookies
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const tokenCookie = cookies.find(c => c.startsWith('jhs_token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }

  return null;
}

/**
 * Set secure HTTP-only cookie with JWT token
 */
export async function setTokenCookie(token: string) {
  const cookieStore = await cookies();
  
  cookieStore.set('jhs_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clear token cookie (logout)
 */
export async function clearTokenCookie() {
  const cookieStore = await cookies();
  
  cookieStore.delete('jhs_token');
}

/**
 * Get current user from token in cookies
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jhs_token')?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}