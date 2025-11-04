import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, or, and, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { requireAuth, requireRole, canModifyUser } from '@/lib/rbac';
import { logAudit, AuditActions, ResourceTypes } from '@/lib/audit-logger';
import { sanitizeString, validateEmail as validateEmailUtil, validateInput } from '@/lib/validation';

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to exclude passwordHash from user object
function sanitizeUser(user: any) {
  const { passwordHash, ...sanitizedUser } = user;
  return sanitizedUser;
}

// Helper to extract IP and User-Agent
function getRequestMetadata(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user: currentUser } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const targetUserId = parseInt(id);

      // Check if user can view this profile
      // Admin: can view all
      // Others: can only view their own profile
      if (currentUser.role !== 'admin' && currentUser.id !== targetUserId) {
        return NextResponse.json(
          { error: 'Accès refusé - Vous ne pouvez voir que votre propre profil', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const result = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          status: users.status,
          phone: users.phone,
          address: users.address,
          photoUrl: users.photoUrl,
          createdAt: users.createdAt,
          lastLogin: users.lastLogin,
        })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    // List users with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    // Build conditions array
    const conditions = [];

    // Search condition
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    // Filter by role
    if (role) {
      conditions.push(eq(users.role, role));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(users.status, status));
    }

    // For non-admin users: return minimal information (id, name, role only)
    // This allows them to see user names in chantiers/stock UI
    if (currentUser.role !== 'admin') {
      const results = conditions.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              role: users.role,
            })
            .from(users)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
        : await db
            .select({
              id: users.id,
              name: users.name,
              role: users.role,
            })
            .from(users)
            .limit(limit)
            .offset(offset);

      return NextResponse.json(results, { status: 200 });
    }

    // For admin: return full information
    const results = conditions.length > 0
      ? await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            status: users.status,
            phone: users.phone,
            address: users.address,
            photoUrl: users.photoUrl,
            createdAt: users.createdAt,
            lastLogin: users.lastLogin,
          })
          .from(users)
          .where(and(...conditions))
          .limit(limit)
          .offset(offset)
      : await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            status: users.status,
            phone: users.phone,
            address: users.address,
            photoUrl: users.photoUrl,
            createdAt: users.createdAt,
            lastLogin: users.lastLogin,
          })
          .from(users)
          .limit(limit)
          .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only admin can create users
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;
    const { user: currentUser } = authResult;

    const metadata = getRequestMetadata(request);
    const body = await request.json();
    const { email, password, name, role, photoUrl, phone, address, status } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters', code: 'INVALID_PASSWORD_LENGTH' },
        { status: 400 }
      );
    }

    // ✅ SANITIZE AND VALIDATE EMAIL
    const emailValidation = validateEmailUtil(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
        { status: 400 }
      );
    }
    const sanitizedEmail = emailValidation.sanitized;

    // ✅ SANITIZE NAME
    const nameValidation = validateInput(name, 'Name');
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error, code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }
    const sanitizedName = nameValidation.sanitized;

    // ✅ SANITIZE OPTIONAL FIELDS
    const sanitizedPhone = phone ? sanitizeString(phone) : null;
    const sanitizedAddress = address ? sanitizeString(address) : null;

    // Validate role
    const validRoles = ['admin', 'travailleur', 'client'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role must be one of: admin, travailleur, client', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status must be one of: active, inactive', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'DUPLICATE_EMAIL' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Prepare insert data
    const insertData = {
      email: sanitizedEmail,
      passwordHash,
      name: sanitizedName,
      role,
      photoUrl: photoUrl || null,
      phone: sanitizedPhone,
      address: sanitizedAddress,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    // Insert user
    const newUser = await db.insert(users).values(insertData).returning();

    // Log creation
    await logAudit({
      userId: currentUser.id,
      action: AuditActions.CREATE_USER,
      resourceType: ResourceTypes.USER,
      resourceId: newUser[0].id,
      ...metadata,
      details: { 
        createdUserEmail: newUser[0].email,
        createdUserRole: newUser[0].role,
        createdUserName: newUser[0].name,
      },
    });

    return NextResponse.json(sanitizeUser(newUser[0]), { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user: currentUser } = authResult;

    const metadata = getRequestMetadata(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const targetUserId = parseInt(id);

    // Check if user can modify this profile
    if (!canModifyUser(currentUser, targetUserId)) {
      await logAudit({
        userId: currentUser.id,
        action: AuditActions.UPDATE_USER,
        resourceType: ResourceTypes.USER,
        resourceId: targetUserId,
        ...metadata,
        details: { error: 'Access denied', attemptedRole: currentUser.role },
      });

      return NextResponse.json(
        { error: 'Accès refusé - Vous ne pouvez modifier que votre propre profil', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, password, name, photoUrl, role, status, phone, address, lastLogin } = body;

    // Prepare update object
    const userUpdates: any = {};

    // Validate and update email if provided
    if (email !== undefined) {
      // ✅ SANITIZE AND VALIDATE EMAIL
      const emailValidation = validateEmailUtil(email);
      if (!emailValidation.valid) {
        return NextResponse.json(
          { error: emailValidation.error || 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
          { status: 400 }
        );
      }
      const sanitizedEmail = emailValidation.sanitized;

      // Check if new email already exists (excluding current user)
      const emailExists = await db
        .select()
        .from(users)
        .where(and(eq(users.email, sanitizedEmail), eq(users.id, targetUserId)))
        .limit(1);

      if (emailExists.length === 0) {
        const duplicateEmail = await db
          .select()
          .from(users)
          .where(eq(users.email, sanitizedEmail))
          .limit(1);

        if (duplicateEmail.length > 0) {
          return NextResponse.json(
            { error: 'Email already exists', code: 'DUPLICATE_EMAIL' },
            { status: 400 }
          );
        }
      }

      userUpdates.email = sanitizedEmail;
    }

    // Hash password if provided
    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters', code: 'INVALID_PASSWORD_LENGTH' },
          { status: 400 }
        );
      }
      userUpdates.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update name if provided
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      // ✅ SANITIZE NAME
      userUpdates.name = sanitizeString(name);
    }

    // Validate and update role if provided (admin only)
    if (role !== undefined) {
      if (currentUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'Seuls les administrateurs peuvent modifier les rôles', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const validRoles = ['admin', 'travailleur', 'client'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Role must be one of: admin, travailleur, client', code: 'INVALID_ROLE' },
          { status: 400 }
        );
      }
      userUpdates.role = role;
    }

    // Validate and update status if provided (admin only)
    if (status !== undefined) {
      if (currentUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'Seuls les administrateurs peuvent modifier le statut', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status must be one of: active, inactive', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      userUpdates.status = status;
    }

    // Update optional fields if provided
    if (photoUrl !== undefined) {
      userUpdates.photoUrl = photoUrl || null;
    }

    if (phone !== undefined) {
      // ✅ SANITIZE PHONE
      userUpdates.phone = phone ? sanitizeString(phone) : null;
    }

    if (address !== undefined) {
      // ✅ SANITIZE ADDRESS
      userUpdates.address = address ? sanitizeString(address) : null;
    }

    if (lastLogin !== undefined) {
      userUpdates.lastLogin = lastLogin || null;
    }

    // Check if there are any updates to apply
    if (Object.keys(userUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    // Perform update
    const updatedUser = await db
      .update(users)
      .set(userUpdates)
      .where(eq(users.id, targetUserId))
      .returning();

    // Log update
    await logAudit({
      userId: currentUser.id,
      action: AuditActions.UPDATE_USER,
      resourceType: ResourceTypes.USER,
      resourceId: targetUserId,
      ...metadata,
      details: { 
        updatedFields: Object.keys(userUpdates),
        targetUserEmail: updatedUser[0].email,
        isSelfUpdate: currentUser.id === targetUserId,
      },
    });

    return NextResponse.json(sanitizeUser(updatedUser[0]), { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Only admin can delete users
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;
    const { user: currentUser } = authResult;

    const metadata = getRequestMetadata(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const targetUserId = parseInt(id);

    // Prevent self-deletion
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte', code: 'CANNOT_DELETE_SELF' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete user
    const deleted = await db
      .delete(users)
      .where(eq(users.id, targetUserId))
      .returning();

    // Log deletion
    await logAudit({
      userId: currentUser.id,
      action: AuditActions.DELETE_USER,
      resourceType: ResourceTypes.USER,
      resourceId: targetUserId,
      ...metadata,
      details: { 
        deletedUserEmail: deleted[0].email,
        deletedUserRole: deleted[0].role,
        deletedUserName: deleted[0].name,
      },
    });

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        user: sanitizeUser(deleted[0]),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}