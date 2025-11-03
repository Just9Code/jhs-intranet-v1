import { NextRequest, NextResponse } from 'next/server';
import { clearTokenCookie, getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { logAudit, AuditActions, ResourceTypes } from '@/lib/audit-logger';
import { getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Get user info before clearing token
    const token = getTokenFromRequest(request);
    const payload = token ? await verifyToken(token) : null;

    // Clear the JWT cookie
    await clearTokenCookie();

    // ✅ Audit log for logout
    if (payload) {
      await logAudit({
        userId: payload.userId,
        action: AuditActions.LOGOUT,
        resourceType: ResourceTypes.AUTH,
        ipAddress: ip,
        userAgent,
        details: {
          email: payload.email,
          name: payload.name,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    console.error('🔴 [AUTH] Sign out error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}