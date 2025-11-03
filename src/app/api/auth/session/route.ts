import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Try to get user from cookie first (server-side)
    let payload = await getCurrentUser();

    // If no cookie, try Authorization header (client-side API calls)
    if (!payload) {
      const token = getTokenFromRequest(request);
      if (token) {
        payload = await verifyToken(token);
      }
    }

    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Fetch fresh user data from database including status
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        address: users.address,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    // ✅ If user not found OR account is inactive, clear session and return null
    if (!user || user.status === 'inactive') {
      const response = NextResponse.json({ 
        user: null,
        accountDisabled: user?.status === 'inactive' 
      }, { status: 200 });
      
      // Clear auth cookie to force logout
      response.cookies.delete('jhs_auth_token');
      
      return response;
    }

    // Return user data without status field (not needed in frontend)
    const { status, ...userWithoutStatus } = user;

    return NextResponse.json({ user: userWithoutStatus });
  } catch (error) {
    console.error('🔴 [AUTH] Session error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}