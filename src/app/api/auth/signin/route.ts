import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateToken, setTokenCookie } from '@/lib/jwt';
import { sanitizeString } from '@/lib/validation';
import { rateLimitLogin, getClientIP } from '@/lib/rate-limit';
import { logAudit, AuditActions, ResourceTypes } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // ✅ Rate limiting: 3 attempts per 15 minutes
  const rateLimit = rateLimitLogin(ip);
  if (!rateLimit.success) {
    const resetInMinutes = Math.ceil((rateLimit.reset - Date.now()) / 60000);
    
    // Log failed attempt due to rate limit
    await logAudit({
      action: AuditActions.LOGIN_FAILED,
      resourceType: ResourceTypes.AUTH,
      ipAddress: ip,
      userAgent,
      details: { reason: 'rate_limit_exceeded', resetInMinutes },
    });

    return NextResponse.json(
      { 
        error: `Trop de tentatives de connexion. Réessayez dans ${resetInMinutes} minute(s).`,
        code: 'RATE_LIMIT_EXCEEDED',
        resetInMinutes,
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.reset).toISOString(),
        }
      }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      await logAudit({
        action: AuditActions.LOGIN_FAILED,
        resourceType: ResourceTypes.AUTH,
        ipAddress: ip,
        userAgent,
        details: { reason: 'missing_credentials', email: email || 'none' },
      });

      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedEmail = sanitizeString(email);

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    if (!user) {
      await logAudit({
        action: AuditActions.LOGIN_FAILED,
        resourceType: ResourceTypes.AUTH,
        ipAddress: ip,
        userAgent,
        details: { reason: 'user_not_found', email: sanitizedEmail },
      });

      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // ✅ Check if account is inactive/disabled
    if (user.status === 'inactive') {
      await logAudit({
        userId: user.id,
        action: AuditActions.LOGIN_FAILED,
        resourceType: ResourceTypes.AUTH,
        ipAddress: ip,
        userAgent,
        details: { reason: 'account_disabled', email: sanitizedEmail },
      });

      return NextResponse.json(
        { 
          error: 'Votre compte a été désactivé. Veuillez contacter un administrateur.',
          code: 'ACCOUNT_DISABLED'
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await logAudit({
        userId: user.id,
        action: AuditActions.LOGIN_FAILED,
        resourceType: ResourceTypes.AUTH,
        ipAddress: ip,
        userAgent,
        details: { reason: 'invalid_password', email: sanitizedEmail },
      });

      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Set secure HTTP-only cookie
    await setTokenCookie(token);

    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date().toISOString() })
      .where(eq(users.id, user.id));

    // ✅ Log successful login
    await logAudit({
      userId: user.id,
      action: AuditActions.LOGIN_SUCCESS,
      resourceType: ResourceTypes.AUTH,
      ipAddress: ip,
      userAgent,
      details: { email: sanitizedEmail, role: user.role },
    });

    // Return user data (without password) and token
    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token, // For localStorage backup
    });
  } catch (error) {
    console.error('🔴 [AUTH] Sign in error:', error);
    
    await logAudit({
      action: AuditActions.LOGIN_FAILED,
      resourceType: ResourceTypes.AUTH,
      ipAddress: ip,
      userAgent,
      details: { reason: 'server_error', error: (error as Error).message },
    });

    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}