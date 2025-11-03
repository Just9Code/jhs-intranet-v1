import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();
    
    console.log('🔵 [CUSTOM SIGNIN API] Login attempt for:', email);
    
    // Find user in the JHS users table
    const foundUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (foundUsers.length === 0) {
      console.log('🔴 [CUSTOM SIGNIN API] User not found');
      return NextResponse.json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou mot de passe incorrect'
        }
      }, { status: 401 });
    }
    
    const foundUser = foundUsers[0];
    
    // Check if account is active - only allow 'active' status
    if (foundUser.status !== 'active') {
      console.log('🔴 [CUSTOM SIGNIN API] Account not active, status:', foundUser.status);
      return NextResponse.json({
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Votre compte a été désactivé. Contactez un administrateur.'
        }
      }, { status: 403 });
    }
    
    // Verify password using passwordHash column
    const passwordMatch = await bcrypt.compare(password, foundUser.passwordHash);
    
    if (!passwordMatch) {
      console.log('🔴 [CUSTOM SIGNIN API] Invalid password');
      return NextResponse.json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou mot de passe incorrect'
        }
      }, { status: 401 });
    }
    
    console.log('✅ [CUSTOM SIGNIN API] Login successful');
    
    // Create session token
    const token = `jhs_${foundUser.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const expiresAt = rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Update last login
    await db.update(users)
      .set({ lastLogin: new Date().toISOString() })
      .where(eq(users.id, foundUser.id));
    
    const response = NextResponse.json({
      data: {
        session: {
          id: token,
          userId: foundUser.id,
          expiresAt: expiresAt.toISOString(),
        },
        user: {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          image: foundUser.photoUrl,
          role: foundUser.role,
          status: foundUser.status,
          phone: foundUser.phone,
          address: foundUser.address,
        },
        token,
      }
    });
    
    // Set cookie
    response.cookies.set('jhs_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/',
    });
    
    return response;
    
  } catch (error: any) {
    console.error('❌ [CUSTOM SIGNIN API] Server error:', error);
    return NextResponse.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Une erreur est survenue',
        details: error.message
      }
    }, { status: 500 });
  }
}