import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stockMateriaux } from '@/db/schema';
import { eq, like, and } from 'drizzle-orm';

const VALID_STATUSES = ['disponible', 'emprunte', 'maintenance'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single materiau by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const materiau = await db
        .select()
        .from(stockMateriaux)
        .where(eq(stockMateriaux.id, parseInt(id)))
        .limit(1);

      if (materiau.length === 0) {
        return NextResponse.json(
          { error: 'Materiau not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(materiau[0], { status: 200 });
    }

    // List with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const conditions = [];

    if (search) {
      conditions.push(like(stockMateriaux.name, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(stockMateriaux.status, status));
    }

    const results = conditions.length > 0
      ? await db.select().from(stockMateriaux).where(and(...conditions)).limit(limit).offset(offset)
      : await db.select().from(stockMateriaux).limit(limit).offset(offset);

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
    const body = await request.json();
    const { name, quantity, unit, status } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must not be empty', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      return NextResponse.json(
        { error: 'Unit is required and must not be empty', code: 'MISSING_UNIT' },
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
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate quantity if provided
    const finalQuantity = quantity !== undefined ? quantity : 0;
    if (typeof finalQuantity !== 'number' || !Number.isInteger(finalQuantity)) {
      return NextResponse.json(
        { error: 'Quantity must be an integer', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    // Create materiau
    const timestamp = new Date().toISOString();
    const newMateriau = await db
      .insert(stockMateriaux)
      .values({
        name: name.trim(),
        quantity: finalQuantity,
        unit: unit.trim(),
        status: status.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json(newMateriau[0], { status: 201 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const materiauId = parseInt(id);

    // Check if materiau exists
    const existing = await db
      .select()
      .from(stockMateriaux)
      .where(eq(stockMateriaux.id, materiauId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Materiau not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, quantity, unit, status } = body;

    // Validate updates
    const updates: Record<string, any> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must not be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (quantity !== undefined) {
      if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
        return NextResponse.json(
          { error: 'Quantity must be an integer', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }
      updates.quantity = quantity;
    }

    if (unit !== undefined) {
      if (typeof unit !== 'string' || unit.trim() === '') {
        return NextResponse.json(
          { error: 'Unit must not be empty', code: 'INVALID_UNIT' },
          { status: 400 }
        );
      }
      updates.unit = unit.trim();
    }

    if (status !== undefined) {
      if (typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      updates.status = status.trim();
    }

    // Always update timestamp
    updates.updatedAt = new Date().toISOString();

    // Update materiau
    const updated = await db
      .update(stockMateriaux)
      .set(updates)
      .where(eq(stockMateriaux.id, materiauId))
      .returning();

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const materiauId = parseInt(id);

    // Check if materiau exists
    const existing = await db
      .select()
      .from(stockMateriaux)
      .where(eq(stockMateriaux.id, materiauId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Materiau not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete materiau
    const deleted = await db
      .delete(stockMateriaux)
      .where(eq(stockMateriaux.id, materiauId))
      .returning();

    return NextResponse.json(
      {
        message: 'Materiau deleted successfully',
        materiau: deleted[0],
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