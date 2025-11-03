import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chantierFiles } from '@/db/schema';
import { eq, like, and } from 'drizzle-orm';

const VALID_FILE_TYPES = ['facture_materiau', 'facture_client', 'devis', 'pdf', 'photo', 'video'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single file by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const file = await db
        .select()
        .from(chantierFiles)
        .where(eq(chantierFiles.id, parseInt(id)))
        .limit(1);

      if (file.length === 0) {
        return NextResponse.json(
          { error: 'File not found', code: 'FILE_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(file[0], { status: 200 });
    }

    // List files with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const chantierId = searchParams.get('chantierId');
    const fileType = searchParams.get('fileType');
    const uploadedBy = searchParams.get('uploadedBy');

    // Build filter conditions
    const conditions = [];

    if (search) {
      conditions.push(like(chantierFiles.fileName, `%${search}%`));
    }

    if (chantierId) {
      conditions.push(eq(chantierFiles.chantierId, parseInt(chantierId)));
    }

    if (fileType) {
      conditions.push(eq(chantierFiles.fileType, fileType));
    }

    if (uploadedBy) {
      conditions.push(eq(chantierFiles.uploadedBy, parseInt(uploadedBy)));
    }

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await db.select().from(chantierFiles).where(and(...conditions)).limit(limit).offset(offset)
      : await db.select().from(chantierFiles).limit(limit).offset(offset);

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
    const { fileName, fileUrl, fileType, chantierId, uploadedBy } = body;

    // Validate required fields
    if (!fileName || !fileName.trim()) {
      return NextResponse.json(
        { error: 'File name is required', code: 'MISSING_FILE_NAME' },
        { status: 400 }
      );
    }

    if (!fileUrl || !fileUrl.trim()) {
      return NextResponse.json(
        { error: 'File URL is required', code: 'MISSING_FILE_URL' },
        { status: 400 }
      );
    }

    if (!fileType || !fileType.trim()) {
      return NextResponse.json(
        { error: 'File type is required', code: 'MISSING_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!VALID_FILE_TYPES.includes(fileType)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Must be one of: ${VALID_FILE_TYPES.join(', ')}`,
          code: 'INVALID_FILE_TYPE',
        },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData: any = {
      fileName: fileName.trim(),
      fileUrl: fileUrl.trim(),
      fileType: fileType.trim(),
      uploadedAt: new Date().toISOString(),
    };

    // Add optional fields if provided
    if (chantierId !== undefined && chantierId !== null) {
      insertData.chantierId = parseInt(chantierId);
    }

    if (uploadedBy !== undefined && uploadedBy !== null) {
      insertData.uploadedBy = parseInt(uploadedBy);
    }

    const newFile = await db.insert(chantierFiles).values(insertData).returning();

    return NextResponse.json(newFile[0], { status: 201 });
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if file exists
    const existing = await db
      .select()
      .from(chantierFiles)
      .where(eq(chantierFiles.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'File not found', code: 'FILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { fileName, fileUrl, fileType, chantierId, uploadedBy } = body;

    // Validate file type if provided
    if (fileType && !VALID_FILE_TYPES.includes(fileType)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Must be one of: ${VALID_FILE_TYPES.join(', ')}`,
          code: 'INVALID_FILE_TYPE',
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (fileName !== undefined) {
      if (!fileName.trim()) {
        return NextResponse.json(
          { error: 'File name cannot be empty', code: 'EMPTY_FILE_NAME' },
          { status: 400 }
        );
      }
      updateData.fileName = fileName.trim();
    }

    if (fileUrl !== undefined) {
      if (!fileUrl.trim()) {
        return NextResponse.json(
          { error: 'File URL cannot be empty', code: 'EMPTY_FILE_URL' },
          { status: 400 }
        );
      }
      updateData.fileUrl = fileUrl.trim();
    }

    if (fileType !== undefined) {
      updateData.fileType = fileType.trim();
    }

    if (chantierId !== undefined) {
      updateData.chantierId = chantierId !== null ? parseInt(chantierId) : null;
    }

    if (uploadedBy !== undefined) {
      updateData.uploadedBy = uploadedBy !== null ? parseInt(uploadedBy) : null;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(chantierFiles)
      .set(updateData)
      .where(eq(chantierFiles.id, parseInt(id)))
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if file exists
    const existing = await db
      .select()
      .from(chantierFiles)
      .where(eq(chantierFiles.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'File not found', code: 'FILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(chantierFiles)
      .where(eq(chantierFiles.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'File deleted successfully',
        file: deleted[0],
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