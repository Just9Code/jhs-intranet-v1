import { NextRequest, NextResponse } from 'next/server';

/**
 * This route is deprecated and should not be used.
 * All authentication routes have been moved to separate endpoints:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/register
 * - /api/auth/session
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use specific auth endpoints.',
      endpoints: {
        signin: '/api/auth/signin',
        signout: '/api/auth/signout',
        register: '/api/auth/register',
        session: '/api/auth/session',
      }
    },
    { status: 410 } // 410 Gone
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use specific auth endpoints.',
      endpoints: {
        signin: '/api/auth/signin',
        signout: '/api/auth/signout',
        register: '/api/auth/register',
        session: '/api/auth/session',
      }
    },
    { status: 410 } // 410 Gone
  );
}
