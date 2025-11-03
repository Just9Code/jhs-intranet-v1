import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Complete user interface combining better-auth session data with users table
 */
export interface CompleteUser {
  id: number;
  authUserId: string | null;
  email: string;
  name: string;
  role: 'admin' | 'travailleur' | 'client';
  status: string;
  phone: string | null;
  address: string | null;
  photoUrl: string | null;
  createdAt: string;
  lastLogin: string | null;
}

/**
 * Better-auth session interface
 */
export interface BetterAuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified?: boolean;
    image?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    userId: string;
  };
}

/**
 * Retrieves complete user information from the users table using a better-auth session
 * 
 * @param session - Better-auth session object containing user.id
 * @returns Complete user object with all fields from users table, or null if not found
 * 
 * @example
 * const session = await auth.api.getSession({ headers: request.headers });
 * const user = await getUserFromSession(session);
 * if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
 */
export async function getUserFromSession(
  session: BetterAuthSession
): Promise<CompleteUser | null> {
  try {
    const authUserId = session.user.id;

    const result = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    return {
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'travailleur' | 'client',
      status: user.status,
      phone: user.phone,
      address: user.address,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

/**
 * Retrieves complete user information from the users table by authUserId
 * 
 * @param authUserId - The UUID from better-auth user table
 * @returns Complete user object with all fields from users table, or null if not found
 * 
 * @example
 * const user = await getUserById(session.user.id);
 * if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
 */
export async function getUserById(
  authUserId: string
): Promise<CompleteUser | null> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    return {
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'travailleur' | 'client',
      status: user.status,
      phone: user.phone,
      address: user.address,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
}

/**
 * Retrieves the role of a user from the users table
 * 
 * @param authUserId - The UUID from better-auth user table
 * @returns User role string, or null if user not found
 * 
 * @example
 * const role = await getUserRole(session.user.id);
 * if (role === 'admin') {
 *   // Admin-specific logic
 * }
 */
export async function getUserRole(authUserId: string): Promise<string | null> {
  try {
    const result = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0].role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Checks if a user has admin role
 * 
 * @param authUserId - The UUID from better-auth user table
 * @returns Boolean indicating if user is an admin
 * 
 * @example
 * if (await isAdmin(session.user.id)) {
 *   // Allow access to admin-only features
 * } else {
 *   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
 * }
 */
export async function isAdmin(authUserId: string): Promise<boolean> {
  try {
    const role = await getUserRole(authUserId);
    return role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
