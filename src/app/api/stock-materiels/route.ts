import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stockMateriels } from '@/db/schema';
import { eq, like, and } from 'drizzle-orm';

const VALID_STATUSES = ['disponible', 'emprunte', 'maintenance'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { 
            error: 'Valid ID is required',
            code: 'INVALID_ID'
          },
          { status: 400 }
        );
      }

      const materiel = await db.select()
        .from(stockMateriels)
        .where(eq(stockMateriels.id, parseInt(id)))
        .limit(1);

      if (materiel.length === 0) {
        return NextResponse.json(
          { error: 'Materiel not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(materiel[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Build filter conditions
    const conditions = [];

    if (search) {
      conditions.push(like(stockMateriels.name, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(stockMateriels.status, status));
    }

    const results = conditions.length > 0
      ? await db.select().from(stockMateriels).where(and(...conditions)).limit(limit).offset(offset)
      : await db.select().from(stockMateriels).limit(limit).offset(offset);

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
    const { name, quantity, status } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Name is required and cannot be empty',
          code: 'MISSING_NAME'
        },
        { status: 400 }
      );
    }

    if (!status || status.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Status is required and cannot be empty',
          code: 'MISSING_STATUS'
        },
        { status: 400 }
      );
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Validate quantity if provided
    if (quantity !== undefined && quantity !== null) {
      if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
        return NextResponse.json(
          { 
            error: 'Quantity must be an integer',
            code: 'INVALID_QUANTITY'
          },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();

    const newMateriel = await db.insert(stockMateriels)
      .values({
        name: name.trim(),
        quantity: quantity ?? 0,
        status: status.trim(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newMateriel[0], { status: 201 });

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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, quantity, status } = body;

    // Check if materiel exists
    const existingMateriel = await db.select()
      .from(stockMateriels)
      .where(eq(stockMateriels.id, parseInt(id)))
      .limit(1);

    if (existingMateriel.length === 0) {
      return NextResponse.json(
        { error: 'Materiel not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (status !== undefined && status !== null) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { 
            error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS'
          },
          { status: 400 }
        );
      }
    }

    // Validate quantity if provided
    if (quantity !== undefined && quantity !== null) {
      if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
        return NextResponse.json(
          { 
            error: 'Quantity must be an integer',
            code: 'INVALID_QUANTITY'
          },
          { status: 400 }
        );
      }
    }

    // Validate name if provided
    if (name !== undefined && name !== null && name.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Name cannot be empty',
          code: 'INVALID_NAME'
        },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined && name !== null) {
      updates.name = name.trim();
    }

    if (quantity !== undefined && quantity !== null) {
      updates.quantity = quantity;
    }

    if (status !== undefined && status !== null) {
      updates.status = status.trim();
    }

    const updatedMateriel = await db.update(stockMateriels)
      .set(updates)
      .where(eq(stockMateriels.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedMateriel[0], { status: 200 });

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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Check if materiel exists
    const existingMateriel = await db.select()
      .from(stockMateriels)
      .where(eq(stockMateriels.id, parseInt(id)))
      .limit(1);

    if (existingMateriel.length === 0) {
      return NextResponse.json(
        { error: 'Materiel not found' },
        { status: 404 }
      );
    }

    const deletedMateriel = await db.delete(stockMateriels)
      .where(eq(stockMateriels.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Materiel deleted successfully',
        materiel: deletedMateriel[0]
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