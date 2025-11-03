import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chantiers } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_STATUSES = ['en_attente', 'en_cours', 'termine', 'annule'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single chantier fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const chantier = await db
        .select()
        .from(chantiers)
        .where(eq(chantiers.id, parseInt(id)))
        .limit(1);

      if (chantier.length === 0) {
        return NextResponse.json(
          { error: 'Chantier not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

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

    // Filter by clientId
    if (clientId && !isNaN(parseInt(clientId))) {
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

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      name: name.trim(),
      address: address.trim(),
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

    if (description) {
      insertData.description = description.trim();
    }

    if (notes) {
      insertData.notes = notes.trim();
    }

    const newChantier = await db.insert(chantiers).values(insertData).returning();

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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if chantier exists
    const existing = await db
      .select()
      .from(chantiers)
      .where(eq(chantiers.id, parseInt(id)))
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
      updates.name = name.trim();
    }

    if (address !== undefined) {
      if (typeof address !== 'string' || address.trim() === '') {
        return NextResponse.json(
          { error: 'Address must not be empty', code: 'INVALID_ADDRESS' },
          { status: 400 }
        );
      }
      updates.address = address.trim();
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
      updates.description = description === null ? null : description.trim();
    }

    if (notes !== undefined) {
      updates.notes = notes === null ? null : notes.trim();
    }

    const updated = await db
      .update(chantiers)
      .set(updates)
      .where(eq(chantiers.id, parseInt(id)))
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if chantier exists
    const existing = await db
      .select()
      .from(chantiers)
      .where(eq(chantiers.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Chantier not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(chantiers)
      .where(eq(chantiers.id, parseInt(id)))
      .returning();

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