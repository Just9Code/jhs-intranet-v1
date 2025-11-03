/**
 * Role-Based Access Control (RBAC)
 * Defines permissions for each role and provides authorization helpers
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type Role = 'admin' | 'travailleur' | 'client';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  status: string;
}

/**
 * Permission matrix for each role
 */
const PERMISSIONS = {
  admin: {
    // Users
    createUser: true,
    updateUser: true,
    deleteUser: true,
    viewAllUsers: true,
    
    // Chantiers
    createChantier: true,
    updateChantier: true,
    deleteChantier: true,
    viewAllChantiers: true,
    
    // Stock
    createStock: true,
    updateStock: true,
    deleteStock: true,
    viewStock: true,
    
    // Files
    uploadFile: true,
    deleteFile: true,
    viewFile: true,
    
    // Invoices & Quotes
    createInvoice: true,
    updateInvoice: true,
    deleteInvoice: true,
    viewInvoice: true,
    
    // Audit Logs
    viewAuditLogs: true,
  },
  travailleur: {
    // Users - can only update their own profile
    createUser: false,
    updateUser: false, // Special: can update own profile
    deleteUser: false,
    viewAllUsers: false,
    
    // Chantiers
    createChantier: true,
    updateChantier: true,
    deleteChantier: true,
    viewAllChantiers: true,
    
    // Stock
    createStock: true,
    updateStock: true,
    deleteStock: true,
    viewStock: true,
    
    // Files
    uploadFile: true,
    deleteFile: true,
    viewFile: true,
    
    // Invoices & Quotes
    createInvoice: true,
    updateInvoice: true,
    deleteInvoice: true,
    viewInvoice: true,
    
    // Audit Logs
    viewAuditLogs: false,
  },
  client: {
    // Users - can only view/update their own profile
    createUser: false,
    updateUser: false, // Special: can update own profile
    deleteUser: false,
    viewAllUsers: false,
    
    // Chantiers - can only view their own
    createChantier: false,
    updateChantier: false,
    deleteChantier: false,
    viewAllChantiers: false, // Special: can view their own
    
    // Stock
    createStock: false,
    updateStock: false,
    deleteStock: false,
    viewStock: false,
    
    // Files - can only view files from their chantiers
    uploadFile: false,
    deleteFile: false,
    viewFile: false, // Special: can view files from their chantiers
    
    // Invoices & Quotes - can only view their own
    createInvoice: false,
    updateInvoice: false,
    deleteInvoice: false,
    viewInvoice: false, // Special: can view their own
    
    // Audit Logs
    viewAuditLogs: false,
  },
};

/**
 * Get current authenticated user from request
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || user.status === 'inactive') {
      return null;
    }

    return user as User;
  } catch (error) {
    console.error('❌ [RBAC] Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user has permission
 */
export function hasPermission(role: Role, permission: keyof typeof PERMISSIONS.admin): boolean {
  return PERMISSIONS[role][permission] === true;
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: NextRequest): Promise<{ user: User } | NextResponse> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  
  return { user };
}

/**
 * Require specific role(s)
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: Role[]
): Promise<{ user: User } | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { user } = authResult;
  
  if (!allowedRoles.includes(user.role as Role)) {
    return NextResponse.json(
      { 
        error: 'Accès interdit - Permissions insuffisantes', 
        code: 'FORBIDDEN',
        required: allowedRoles,
        current: user.role,
      },
      { status: 403 }
    );
  }
  
  return { user };
}

/**
 * Require specific permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: keyof typeof PERMISSIONS.admin
): Promise<{ user: User } | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { user } = authResult;
  
  if (!hasPermission(user.role as Role, permission)) {
    return NextResponse.json(
      { 
        error: 'Accès interdit - Permission manquante', 
        code: 'FORBIDDEN',
        required: permission,
        role: user.role,
      },
      { status: 403 }
    );
  }
  
  return { user };
}

/**
 * Check if user can access a specific chantier
 * - Admin/Travailleur: can access all
 * - Client: can only access their own
 */
export async function canAccessChantier(user: User, chantierId: number): Promise<boolean> {
  if (user.role === 'admin' || user.role === 'travailleur') {
    return true;
  }
  
  // Client can only access their own chantiers
  if (user.role === 'client') {
    try {
      const { chantiers } = await import('@/db/schema');
      const [chantier] = await db
        .select({ clientId: chantiers.clientId })
        .from(chantiers)
        .where(eq(chantiers.id, chantierId))
        .limit(1);
      
      return chantier?.clientId === user.id;
    } catch (error) {
      console.error('❌ [RBAC] Error checking chantier access:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Check if user can modify another user
 * - Admin: can modify all
 * - Others: can only modify themselves
 */
export function canModifyUser(currentUser: User, targetUserId: number): boolean {
  if (currentUser.role === 'admin') {
    return true;
  }
  
  return currentUser.id === targetUserId;
}
