import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from request (cookie or Authorization header)
  const token = getTokenFromRequest(request);

  // Verify token
  const payload = token ? await verifyToken(token) : null;

  // If no valid session, redirect to login
  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Check if user account is still active in database
  try {
    const [user] = await db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || user.status === 'inactive') {
      // Account disabled - clear session and redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'account_disabled');
      
      const response = NextResponse.redirect(loginUrl);
      // Clear auth cookie - FIXED: Use correct cookie name
      response.cookies.delete('jhs_token');
      
      return response;
    }
  } catch (error) {
    console.error('🔴 [MIDDLEWARE] Error checking user status:', error);
  }

  // User is authenticated and active, allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chantiers/:path*',
    '/stock/:path*',
    '/users/:path*',
    '/factures/:path*',
    '/audit-logs/:path*',
    '/api/chantiers/:path*',
    '/api/chantier-files/:path*',
    '/api/stock-materiaux/:path*',
    '/api/stock-materiels/:path*',
    '/api/stock-movements/:path*',
    '/api/users/:path*',
    '/api/invoices-quotes/:path*',
    '/api/storage/:path*',
    '/api/upload/:path*',
    '/api/delete-file/:path*',
    '/api/audit-logs/:path*',
  ],
};