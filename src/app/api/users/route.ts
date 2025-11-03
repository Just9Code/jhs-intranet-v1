import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, or, and, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

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

export async function GET(request: NextRequest) {
  try {
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
        .where(eq(users.id, parseInt(id)))
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

    // Build base query
    let query = db
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
      .from(users);

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

    // Apply all conditions and execute query
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

    // Sanitize and validate email
    const sanitizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
        { status: 400 }
      );
    }

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

    // Check if email already exists in users table
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

    // Prepare insert data for users table
    const insertData = {
      email: sanitizedEmail,
      passwordHash,
      name: name.trim(),
      role,
      photoUrl: photoUrl || null,
      phone: phone || null,
      address: address || null,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    // Insert user
    const newUser = await db.insert(users).values(insertData).returning();

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
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
      const sanitizedEmail = email.trim().toLowerCase();
      if (!isValidEmail(sanitizedEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
          { status: 400 }
        );
      }

      // Check if new email already exists (excluding current user)
      const emailExists = await db
        .select()
        .from(users)
        .where(and(eq(users.email, sanitizedEmail), eq(users.id, parseInt(id))))
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
      userUpdates.name = name.trim();
    }

    // Validate and update role if provided
    if (role !== undefined) {
      const validRoles = ['admin', 'travailleur', 'client'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Role must be one of: admin, travailleur, client', code: 'INVALID_ROLE' },
          { status: 400 }
        );
      }
      userUpdates.role = role;
    }

    // Validate and update status if provided
    if (status !== undefined) {
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
      userUpdates.phone = phone || null;
    }

    if (address !== undefined) {
      userUpdates.address = address || null;
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

    // Perform update on users table
    const updatedUser = await db
      .update(users)
      .set(userUpdates)
      .where(eq(users.id, parseInt(id)))
      .returning();

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete user from users table
    const deleted = await db
      .delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

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