import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { requireRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    // Only admin can view audit logs
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const log = await db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          userName: users.name,
          action: auditLogs.action,
          resourceType: auditLogs.resourceType,
          resourceId: auditLogs.resourceId,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          details: auditLogs.details,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(eq(auditLogs.id, parseInt(id)))
        .limit(1);

      if (log.length === 0) {
        return NextResponse.json(
          { error: 'Audit log not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(log[0], { status: 200 });
    }

    // List with pagination and filtering
    const page = Math.max(parseInt(searchParams.get('page') ?? '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = (page - 1) * limit;

    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build conditions array for filtering
    const conditions = [];

    if (userId) {
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return NextResponse.json(
          { error: 'Invalid userId parameter', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(auditLogs.userId, userIdInt));
    }

    if (action && action !== 'all') {
      conditions.push(eq(auditLogs.action, action));
    }

    if (resourceType && resourceType !== 'all') {
      conditions.push(eq(auditLogs.resourceType, resourceType));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, endDate));
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countQuery = whereClause
      ? db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(whereClause)
      : db.select({ count: sql<number>`count(*)` }).from(auditLogs);

    const [{ count: total }] = await countQuery;

    // Build query with conditional where clause
    let queryBuilder = db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: users.name,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .$dynamic();

    if (whereClause) {
      queryBuilder = queryBuilder.where(whereClause);
    }

    const logs = await queryBuilder
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(
      {
        logs,
        total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, resourceType, resourceId, ipAddress, userAgent, details } = body;

    // Validate required fields
    if (!action || typeof action !== 'string' || action.trim() === '') {
      return NextResponse.json(
        { error: 'action is required and must be a non-empty string', code: 'MISSING_ACTION' },
        { status: 400 }
      );
    }

    if (!resourceType || typeof resourceType !== 'string' || resourceType.trim() === '') {
      return NextResponse.json(
        { error: 'resourceType is required and must be a non-empty string', code: 'MISSING_RESOURCE_TYPE' },
        { status: 400 }
      );
    }

    if (!ipAddress || typeof ipAddress !== 'string' || ipAddress.trim() === '') {
      return NextResponse.json(
        { error: 'ipAddress is required and must be a non-empty string', code: 'MISSING_IP_ADDRESS' },
        { status: 400 }
      );
    }

    if (!userAgent || typeof userAgent !== 'string' || userAgent.trim() === '') {
      return NextResponse.json(
        { error: 'userAgent is required and must be a non-empty string', code: 'MISSING_USER_AGENT' },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (userId !== undefined && userId !== null) {
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return NextResponse.json(
          { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
    }

    if (resourceId !== undefined && resourceId !== null) {
      const resourceIdInt = parseInt(resourceId);
      if (isNaN(resourceIdInt)) {
        return NextResponse.json(
          { error: 'resourceId must be a valid integer', code: 'INVALID_RESOURCE_ID' },
          { status: 400 }
        );
      }
    }

    // Validate details is valid JSON if provided
    if (details !== undefined && details !== null) {
      if (typeof details === 'string') {
        try {
          JSON.parse(details);
        } catch (e) {
          return NextResponse.json(
            { error: 'details must be a valid JSON string', code: 'INVALID_DETAILS_JSON' },
            { status: 400 }
          );
        }
      } else if (typeof details === 'object') {
        // If details is already an object, stringify it
      } else {
        return NextResponse.json(
          { error: 'details must be a valid JSON string or object', code: 'INVALID_DETAILS_TYPE' },
          { status: 400 }
        );
      }
    }

    // Prepare insert data
    const insertData: any = {
      action: action.trim(),
      resourceType: resourceType.trim(),
      ipAddress: ipAddress.trim(),
      userAgent: userAgent.trim(),
      createdAt: new Date().toISOString(),
    };

    if (userId !== undefined && userId !== null) {
      insertData.userId = parseInt(userId);
    }

    if (resourceId !== undefined && resourceId !== null) {
      insertData.resourceId = parseInt(resourceId);
    }

    if (details !== undefined && details !== null) {
      insertData.details = typeof details === 'string' ? details : JSON.stringify(details);
    }

    const newLog = await db.insert(auditLogs).values(insertData).returning();

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}