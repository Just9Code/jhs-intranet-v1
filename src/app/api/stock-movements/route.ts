import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stockMovements } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/rbac';
import { logAudit, AuditActions, ResourceTypes } from '@/lib/audit-logger';

const VALID_ITEM_TYPES = ['materiau', 'materiel'];
const VALID_ACTIONS = ['retrait', 'retour', 'ajout', 'suppression'];

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
    // Require admin or travailleur role
    const authResult = await requireRole(request, ['admin', 'travailleur']);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const movement = await db.select()
        .from(stockMovements)
        .where(eq(stockMovements.id, parseInt(id)))
        .limit(1);

      if (movement.length === 0) {
        return NextResponse.json({ 
          error: 'Movement not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(movement[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const itemType = searchParams.get('itemType');
    const itemId = searchParams.get('itemId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Build filter conditions
    const conditions = [];
    if (itemType) {
      conditions.push(eq(stockMovements.itemType, itemType));
    }
    if (itemId) {
      conditions.push(eq(stockMovements.itemId, parseInt(itemId)));
    }
    if (userId) {
      conditions.push(eq(stockMovements.userId, parseInt(userId)));
    }
    if (action) {
      conditions.push(eq(stockMovements.action, action));
    }

    const results = conditions.length > 0
      ? await db.select()
          .from(stockMovements)
          .where(and(...conditions))
          .orderBy(desc(stockMovements.date))
          .limit(limit)
          .offset(offset)
      : await db.select()
          .from(stockMovements)
          .orderBy(desc(stockMovements.date))
          .limit(limit)
          .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin or travailleur role
    const authResult = await requireRole(request, ['admin', 'travailleur']);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const metadata = getRequestMetadata(request);
    const body = await request.json();
    const { itemType, itemId, userId, action, quantity, notes } = body;

    // Validate required fields
    if (!itemType) {
      return NextResponse.json({ 
        error: "itemType is required",
        code: "MISSING_ITEM_TYPE" 
      }, { status: 400 });
    }

    if (!itemId) {
      return NextResponse.json({ 
        error: "itemId is required",
        code: "MISSING_ITEM_ID" 
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ 
        error: "action is required",
        code: "MISSING_ACTION" 
      }, { status: 400 });
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json({ 
        error: "quantity is required",
        code: "MISSING_QUANTITY" 
      }, { status: 400 });
    }

    // Validate itemType
    if (!VALID_ITEM_TYPES.includes(itemType)) {
      return NextResponse.json({ 
        error: `itemType must be one of: ${VALID_ITEM_TYPES.join(', ')}`,
        code: "INVALID_ITEM_TYPE" 
      }, { status: 400 });
    }

    // Validate action
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ 
        error: `action must be one of: ${VALID_ACTIONS.join(', ')}`,
        code: "INVALID_ACTION" 
      }, { status: 400 });
    }

    // Validate quantity is integer
    if (!Number.isInteger(quantity)) {
      return NextResponse.json({ 
        error: "quantity must be an integer",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    // Validate itemId is integer
    if (!Number.isInteger(itemId)) {
      return NextResponse.json({ 
        error: "itemId must be an integer",
        code: "INVALID_ITEM_ID" 
      }, { status: 400 });
    }

    // Validate userId is integer if provided
    if (userId !== undefined && userId !== null && !Number.isInteger(userId)) {
      return NextResponse.json({ 
        error: "userId must be an integer",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    const newMovement = await db.insert(stockMovements)
      .values({
        itemType,
        itemId,
        userId: userId ?? null,
        action,
        quantity,
        date: new Date().toISOString(),
        notes: notes ?? null,
      })
      .returning();

    // Log creation
    await logAudit({
      userId: user.id,
      action: AuditActions.CREATE_STOCK_MOVEMENT,
      resourceType: ResourceTypes.STOCK_MOVEMENT,
      resourceId: newMovement[0].id,
      ...metadata,
      details: { 
        itemType: newMovement[0].itemType,
        itemId: newMovement[0].itemId,
        action: newMovement[0].action,
        quantity: newMovement[0].quantity,
      },
    });

    return NextResponse.json(newMovement[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require admin or travailleur role
    const authResult = await requireRole(request, ['admin', 'travailleur']);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const metadata = getRequestMetadata(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const movementId = parseInt(id);

    // Check if movement exists
    const existingMovement = await db.select()
      .from(stockMovements)
      .where(eq(stockMovements.id, movementId))
      .limit(1);

    if (existingMovement.length === 0) {
      return NextResponse.json({ 
        error: 'Movement not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { itemType, itemId, userId, action, quantity, date, notes } = body;

    // Validate itemType if provided
    if (itemType && !VALID_ITEM_TYPES.includes(itemType)) {
      return NextResponse.json({ 
        error: `itemType must be one of: ${VALID_ITEM_TYPES.join(', ')}`,
        code: "INVALID_ITEM_TYPE" 
      }, { status: 400 });
    }

    // Validate action if provided
    if (action && !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ 
        error: `action must be one of: ${VALID_ACTIONS.join(', ')}`,
        code: "INVALID_ACTION" 
      }, { status: 400 });
    }

    // Validate quantity if provided
    if (quantity !== undefined && !Number.isInteger(quantity)) {
      return NextResponse.json({ 
        error: "quantity must be an integer",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    // Validate itemId if provided
    if (itemId !== undefined && !Number.isInteger(itemId)) {
      return NextResponse.json({ 
        error: "itemId must be an integer",
        code: "INVALID_ITEM_ID" 
      }, { status: 400 });
    }

    // Validate userId if provided
    if (userId !== undefined && userId !== null && !Number.isInteger(userId)) {
      return NextResponse.json({ 
        error: "userId must be an integer",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    const updates: any = {};
    if (itemType !== undefined) updates.itemType = itemType;
    if (itemId !== undefined) updates.itemId = itemId;
    if (userId !== undefined) updates.userId = userId;
    if (action !== undefined) updates.action = action;
    if (quantity !== undefined) updates.quantity = quantity;
    if (date !== undefined) updates.date = date;
    if (notes !== undefined) updates.notes = notes;

    const updated = await db.update(stockMovements)
      .set(updates)
      .where(eq(stockMovements.id, movementId))
      .returning();

    // Log update
    await logAudit({
      userId: user.id,
      action: AuditActions.CREATE_STOCK_MOVEMENT,
      resourceType: ResourceTypes.STOCK_MOVEMENT,
      resourceId: movementId,
      ...metadata,
      details: { 
        changes: Object.keys(updates),
        previousAction: existingMovement[0].action,
        newAction: updated[0].action,
      },
    });

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require admin or travailleur role
    const authResult = await requireRole(request, ['admin', 'travailleur']);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const metadata = getRequestMetadata(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const movementId = parseInt(id);

    // Check if movement exists
    const existingMovement = await db.select()
      .from(stockMovements)
      .where(eq(stockMovements.id, movementId))
      .limit(1);

    if (existingMovement.length === 0) {
      return NextResponse.json({ 
        error: 'Movement not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(stockMovements)
      .where(eq(stockMovements.id, movementId))
      .returning();

    // Log deletion
    await logAudit({
      userId: user.id,
      action: AuditActions.CREATE_STOCK_MOVEMENT,
      resourceType: ResourceTypes.STOCK_MOVEMENT,
      resourceId: movementId,
      ...metadata,
      details: { 
        deletedItemType: deleted[0].itemType,
        deletedItemId: deleted[0].itemId,
        deletedAction: deleted[0].action,
        deletedQuantity: deleted[0].quantity,
      },
    });

    return NextResponse.json({ 
      message: 'Movement deleted successfully',
      movement: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}