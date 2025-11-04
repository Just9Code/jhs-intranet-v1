import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chantiers } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { requireAuth, requirePermission, canAccessChantier } from '@/lib/rbac';
import { logAudit, AuditActions, ResourceTypes } from '@/lib/audit-logger';
import { sanitizeString, validateInput } from '@/lib/validation';

const VALID_STATUSES = ['en_attente', 'en_cours', 'termine', 'annule'] as const;

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
    const { user } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const metadata = getRequestMetadata(request);

    // Single chantier fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const chantierId = parseInt(id);

      // Check access: clients can only view their own chantiers
      if (!await canAccessChantier(user, chantierId)) {
        await logAudit({
          userId: user.id,
          action: AuditActions.VIEW_CHANTIER,
          resourceType: ResourceTypes.CHANTIER,
          resourceId: chantierId,
          ...metadata,
          details: { error: 'Access denied', role: user.role },
        });

        return NextResponse.json(
          { error: 'Accès refusé - Ce chantier ne vous appartient pas', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const chantier = await db
        .select()
        .from(chantiers)
        .where(eq(chantiers.id, chantierId))
        .limit(1);

      if (chantier.length === 0) {
        return NextResponse.json(
          { error: 'Chantier not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      // Log successful view
      await logAudit({
        userId: user.id,
        action: AuditActions.VIEW_CHANTIER,
        resourceType: ResourceTypes.CHANTIER,
        resourceId: chantierId,
        ...metadata,
      });

      return NextResponse.json(chantier[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const responsableId = searchParams.get('responsableId');

    const conditions = [];

    // For clients: filter to show only their chantiers
    if (user.role === 'client') {
      conditions.push(eq(chantiers.clientId, user.id));
    }

    // Search in name and address
    if (search) {
      conditions.push(
        or(
          like(chantiers.name, `%${search}%`),
          like(chantiers.address, `%${search}%`)
        )
      );
    }

    // Filter by status
    if (status) {
      conditions.push(eq(chantiers.status, status));
    }

    // Filter by clientId (only for admin/travailleur)
    if (clientId && !isNaN(parseInt(clientId)) && user.role !== 'client') {
      conditions.push(eq(chantiers.clientId, parseInt(clientId)));
    }

    // Filter by responsableId
    if (responsableId && !isNaN(parseInt(responsableId))) {
      conditions.push(eq(chantiers.responsableId, parseInt(responsableId)));
    }

    const results = conditions.length > 0
      ? await db
          .select()
          .from(chantiers)
          .where(and(...conditions))
          .orderBy(desc(chantiers.createdAt))
          .limit(limit)
          .offset(offset)
      : await db
          .select()
          .from(chantiers)
          .orderBy(desc(chantiers.createdAt))
          .limit(limit)
          .offset(offset);

    return NextResponse.json(results, { status: 200 });
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
    // Require permission to create chantiers (admin/travailleur only)
    const authResult = await requirePermission(request, 'createChantier');
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const metadata = getRequestMetadata(request);
    const body = await request.json();
    const {
      name,
      address,
      status,
      clientId,
      responsableId,
      startDate,
      endDate,
      description,
      notes,
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must not be empty', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!address || typeof address !== 'string' || address.trim() === '') {
      return NextResponse.json(
        { error: 'Address is required and must not be empty', code: 'MISSING_ADDRESS' },
        { status: 400 }
      );
    }

    if (!status || typeof status !== 'string' || status.trim() === '') {
      return NextResponse.json(
        { error: 'Status is required and must not be empty', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // ✅ SANITIZE INPUTS TO PREVENT XSS
    const sanitizedName = sanitizeString(name);
    const sanitizedAddress = sanitizeString(address);
    const sanitizedDescription = description ? sanitizeString(description) : null;
    const sanitizedNotes = notes ? sanitizeString(notes) : null;

    // Validate for malicious patterns
    const nameValidation = validateInput(name, 'Name');
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error, code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      name: sanitizedName,
      address: sanitizedAddress,
      status: status.trim(),
      createdAt: now,
      updatedAt: now,
    };

    // Add optional fields if provided
    if (clientId !== undefined && clientId !== null) {
      insertData.clientId = parseInt(clientId);
    }

    if (responsableId !== undefined && responsableId !== null) {
      insertData.responsableId = parseInt(responsableId);
    }

    if (startDate) {
      insertData.startDate = startDate;
    }

    if (endDate) {
      insertData.endDate = endDate;
    }

    if (sanitizedDescription) {
      insertData.description = sanitizedDescription;
    }

    if (sanitizedNotes) {
      insertData.notes = sanitizedNotes;
    }

    const newChantier = await db.insert(chantiers).values(insertData).returning();

    // Log creation
    await logAudit({
      userId: user.id,
      action: AuditActions.CREATE_CHANTIER,
      resourceType: ResourceTypes.CHANTIER,
      resourceId: newChantier[0].id,
      ...metadata,
      details: { name: newChantier[0].name, status: newChantier[0].status },
    });

    return NextResponse.json(newChantier[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require permission to update chantiers (admin/travailleur only)
    const authResult = await requirePermission(request, 'updateChantier');
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const metadata = getRequestMetadata(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const chantierId = parseInt(id);

    // Check if chantier exists
    const existing = await db
      .select()
      .from(chantiers)
      .where(eq(chantiers.id, chantierId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Chantier not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      clientId,
      responsableId,
      status,
      startDate,
      endDate,
      address,
      description,
      notes,
    } = body;

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add optional fields
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must not be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      // ✅ SANITIZE INPUT
      updates.name = sanitizeString(name);
    }

    if (address !== undefined) {
      if (typeof address !== 'string' || address.trim() === '') {
        return NextResponse.json(
          { error: 'Address must not be empty', code: 'INVALID_ADDRESS' },
          { status: 400 }
        );
      }
      // ✅ SANITIZE INPUT
      updates.address = sanitizeString(address);
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    if (clientId !== undefined) {
      if (clientId === null) {
        updates.clientId = null;
      } else {
        updates.clientId = parseInt(clientId);
      }
    }

    if (responsableId !== undefined) {
      if (responsableId === null) {
        updates.responsableId = null;
      } else {
        updates.responsableId = parseInt(responsableId);
      }
    }

    if (startDate !== undefined) {
      updates.startDate = startDate === null ? null : startDate;
    }

    if (endDate !== undefined) {
      updates.endDate = endDate === null ? null : endDate;
    }

    if (description !== undefined) {
      // ✅ SANITIZE INPUT
      updates.description = description === null ? null : sanitizeString(description);
    }

    if (notes !== undefined) {
      // ✅ SANITIZE INPUT
      updates.notes = notes === null ? null : sanitizeString(notes);
    }

    const updated = await db
      .update(chantiers)
      .set(updates)
      .where(eq(chantiers.id, chantierId))
      .returning();

    // Log update
    await logAudit({
      userId: user.id,
      action: AuditActions.UPDATE_CHANTIER,
      resourceType: ResourceTypes.CHANTIER,
      resourceId: chantierId,
      ...metadata,
      details: { 
        changes: Object.keys(updates).filter(k => k !== 'updatedAt'),
        previousName: existing[0].name,
        newName: updated[0].name,
      },
    });

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require permission to delete chantiers (admin/travailleur only)
    const authResult = await requirePermission(request, 'deleteChantier');
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const metadata = getRequestMetadata(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const chantierId = parseInt(id);

    // Check if chantier exists
    const existing = await db
      .select()
      .from(chantiers)
      .where(eq(chantiers.id, chantierId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Chantier not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(chantiers)
      .where(eq(chantiers.id, chantierId))
      .returning();

    // Log deletion
    await logAudit({
      userId: user.id,
      action: AuditActions.DELETE_CHANTIER,
      resourceType: ResourceTypes.CHANTIER,
      resourceId: chantierId,
      ...metadata,
      details: { 
        deletedName: deleted[0].name,
        deletedStatus: deleted[0].status,
      },
    });

    return NextResponse.json(
      {
        message: 'Chantier deleted successfully',
        chantier: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}