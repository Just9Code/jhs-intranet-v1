import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoicesQuotes, chantiers } from '@/db/schema';
import { eq, like, and, or, gte, lte, desc, asc, inArray } from 'drizzle-orm';
import { requireAuth, requireRole } from '@/lib/rbac';
import { logAudit, AuditActions, ResourceTypes } from '@/lib/audit-logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_INVOICE_STATUSES = ['draft', 'sent', 'paid', 'cancelled'];
const VALID_QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected'];

interface InvoiceQuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
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

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function validateItems(items: any): { valid: boolean; error?: string } {
  if (!Array.isArray(items)) {
    return { valid: false, error: 'Items must be an array' };
  }

  if (items.length === 0) {
    return { valid: false, error: 'Items array cannot be empty' };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.description || typeof item.description !== 'string') {
      return { valid: false, error: `Item ${i + 1}: description is required and must be a string` };
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      return { valid: false, error: `Item ${i + 1}: quantity must be a positive number` };
    }
    if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
      return { valid: false, error: `Item ${i + 1}: unit_price must be a non-negative number` };
    }
    if (typeof item.total !== 'number' || item.total < 0) {
      return { valid: false, error: `Item ${i + 1}: total must be a non-negative number` };
    }
  }

  return { valid: true };
}

function validateStatus(type: string, status: string): boolean {
  if (type === 'invoice') {
    return VALID_INVOICE_STATUSES.includes(status);
  } else if (type === 'quote') {
    return VALID_QUOTE_STATUSES.includes(status);
  }
  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const invoiceQuoteId = parseInt(id);

      const record = await db
        .select()
        .from(invoicesQuotes)
        .where(eq(invoicesQuotes.id, invoiceQuoteId))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      // For clients: check if they own the chantier
      if (user.role === 'client') {
        if (record[0].chantierId) {
          const chantier = await db
            .select()
            .from(chantiers)
            .where(eq(chantiers.id, record[0].chantierId))
            .limit(1);

          if (chantier.length === 0 || chantier[0].clientId !== user.id) {
            return NextResponse.json(
              { error: 'Accès refusé - Cette facture ne vous appartient pas', code: 'FORBIDDEN' },
              { status: 403 }
            );
          }
        } else {
          // No chantier associated, client cannot access
          return NextResponse.json(
            { error: 'Accès refusé', code: 'FORBIDDEN' },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filters, search, and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const clientName = searchParams.get('client_name');
    const chantierId = searchParams.get('chantierId');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const sortField = searchParams.get('sort') ?? 'issueDate';
    const sortOrder = searchParams.get('order') ?? 'desc';

    const conditions = [];

    // For clients: only show invoices/quotes from their chantiers
    if (user.role === 'client') {
      // Get all chantier IDs belonging to this client
      const clientChantiers = await db
        .select({ id: chantiers.id })
        .from(chantiers)
        .where(eq(chantiers.clientId, user.id));

      const clientChantierIds = clientChantiers.map(c => c.id);

      if (clientChantierIds.length === 0) {
        // Client has no chantiers, return empty array
        return NextResponse.json([], { status: 200 });
      }

      conditions.push(inArray(invoicesQuotes.chantierId, clientChantierIds));
    }

    // Type filter
    if (type) {
      if (type !== 'invoice' && type !== 'quote') {
        return NextResponse.json(
          { error: 'Type must be either "invoice" or "quote"', code: 'INVALID_TYPE' },
          { status: 400 }
        );
      }
      conditions.push(eq(invoicesQuotes.type, type));
    }

    // Status filter
    if (status) {
      conditions.push(eq(invoicesQuotes.status, status));
    }

    // Client name filter (partial match)
    if (clientName) {
      conditions.push(like(invoicesQuotes.clientName, `%${clientName}%`));
    }

    // Chantier ID filter
    if (chantierId) {
      if (isNaN(parseInt(chantierId))) {
        return NextResponse.json(
          { error: 'Invalid chantier ID', code: 'INVALID_CHANTIER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(invoicesQuotes.chantierId, parseInt(chantierId)));
    }

    // Date range filters
    if (startDate) {
      conditions.push(gte(invoicesQuotes.issueDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(invoicesQuotes.issueDate, endDate));
    }

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(invoicesQuotes.clientName, `%${search}%`),
          like(invoicesQuotes.clientEmail, `%${search}%`),
          like(invoicesQuotes.documentNumber, `%${search}%`)
        )
      );
    }

    // Build query
    const orderFn = sortOrder === 'asc' ? asc : desc;
    
    // Type-safe column selection
    let sortColumn;
    if (sortField === 'issueDate') {
      sortColumn = invoicesQuotes.issueDate;
    } else if (sortField === 'totalAmount') {
      sortColumn = invoicesQuotes.totalAmount;
    } else if (sortField === 'status') {
      sortColumn = invoicesQuotes.status;
    } else if (sortField === 'type') {
      sortColumn = invoicesQuotes.type;
    } else {
      sortColumn = invoicesQuotes.issueDate;
    }

    const results = conditions.length > 0
      ? await db
          .select()
          .from(invoicesQuotes)
          .where(and(...conditions))
          .orderBy(orderFn(sortColumn))
          .limit(limit)
          .offset(offset)
      : await db
          .select()
          .from(invoicesQuotes)
          .orderBy(orderFn(sortColumn))
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
    // Only admin/travailleur can create invoices/quotes
    const authResult = await requireRole(request, ['admin', 'travailleur']);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const metadata = getRequestMetadata(request);
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'type',
      'documentNumber',
      'clientName',
      'clientEmail',
      'clientAddress',
      'issueDate',
      'status',
      'items',
      'subtotal',
      'taxRate',
      'taxAmount',
      'totalAmount',
    ];

    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { error: `${field} is required`, code: 'MISSING_REQUIRED_FIELD' },
          { status: 400 }
        );
      }
    }

    // Validate type
    if (body.type !== 'invoice' && body.type !== 'quote') {
      return NextResponse.json(
        { error: 'Type must be either "invoice" or "quote"', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Validate status
    if (!validateStatus(body.type, body.status)) {
      const validStatuses =
        body.type === 'invoice' ? VALID_INVOICE_STATUSES : VALID_QUOTE_STATUSES;
      return NextResponse.json(
        {
          error: `Invalid status for ${body.type}. Valid statuses: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate email
    if (!validateEmail(body.clientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Validate items
    const itemsValidation = validateItems(body.items);
    if (!itemsValidation.valid) {
      return NextResponse.json(
        { error: itemsValidation.error, code: 'INVALID_ITEMS' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (
      typeof body.subtotal !== 'number' ||
      typeof body.taxRate !== 'number' ||
      typeof body.taxAmount !== 'number' ||
      typeof body.totalAmount !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Subtotal, taxRate, taxAmount, and totalAmount must be numbers', code: 'INVALID_NUMBERS' },
        { status: 400 }
      );
    }

    // Check for unique document number
    const existingDoc = await db
      .select()
      .from(invoicesQuotes)
      .where(eq(invoicesQuotes.documentNumber, body.documentNumber.trim()))
      .limit(1);

    if (existingDoc.length > 0) {
      return NextResponse.json(
        { error: 'Document number already exists', code: 'DUPLICATE_DOCUMENT_NUMBER' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      type: body.type,
      documentNumber: body.documentNumber.trim(),
      clientName: body.clientName.trim(),
      clientEmail: body.clientEmail.trim().toLowerCase(),
      clientAddress: body.clientAddress.trim(),
      issueDate: body.issueDate,
      status: body.status,
      items: JSON.stringify(body.items),
      subtotal: body.subtotal,
      taxRate: body.taxRate,
      taxAmount: body.taxAmount,
      totalAmount: body.totalAmount,
      createdAt: now,
      updatedAt: now,
    };

    // Optional fields
    if (body.clientPhone) insertData.clientPhone = body.clientPhone.trim();
    if (body.chantierId) insertData.chantierId = body.chantierId;
    if (body.dueDate) insertData.dueDate = body.dueDate;
    if (body.validityDate) insertData.validityDate = body.validityDate;
    if (body.notes) insertData.notes = body.notes.trim();
    if (body.terms) insertData.terms = body.terms.trim();
    if (body.createdBy) insertData.createdBy = body.createdBy;
    if (body.pdfUrl) insertData.pdfUrl = body.pdfUrl.trim();

    const newRecord = await db.insert(invoicesQuotes).values(insertData).returning();

    // Log creation
    await logAudit({
      userId: user.id,
      action: body.type === 'invoice' ? AuditActions.CREATE_INVOICE : AuditActions.CREATE_QUOTE,
      resourceType: body.type === 'invoice' ? ResourceTypes.INVOICE : ResourceTypes.QUOTE,
      resourceId: newRecord[0].id,
      ...metadata,
      details: { 
        documentNumber: newRecord[0].documentNumber,
        type: newRecord[0].type,
        totalAmount: newRecord[0].totalAmount,
      },
    });

    return NextResponse.json(newRecord[0], { status: 201 });
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
    // Only admin/travailleur can update invoices/quotes
    const authResult = await requireRole(request, ['admin', 'travailleur']);
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

    const recordId = parseInt(id);
    const body = await request.json();

    // Check if record exists
    const existing = await db
      .select()
      .from(invoicesQuotes)
      .where(eq(invoicesQuotes.id, recordId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and update type if provided
    if (body.type !== undefined) {
      if (body.type !== 'invoice' && body.type !== 'quote') {
        return NextResponse.json(
          { error: 'Type must be either "invoice" or "quote"', code: 'INVALID_TYPE' },
          { status: 400 }
        );
      }
      updateData.type = body.type;
    }

    // Validate document number uniqueness if provided
    if (body.documentNumber !== undefined) {
      const existingDoc = await db
        .select()
        .from(invoicesQuotes)
        .where(eq(invoicesQuotes.documentNumber, body.documentNumber.trim()))
        .limit(1);

      if (existingDoc.length > 0 && existingDoc[0].id !== recordId) {
        return NextResponse.json(
          { error: 'Document number already exists', code: 'DUPLICATE_DOCUMENT_NUMBER' },
          { status: 400 }
        );
      }
      updateData.documentNumber = body.documentNumber.trim();
    }

    // Validate status if provided
    if (body.status !== undefined) {
      const typeToCheck = body.type ?? existing[0].type;
      if (!validateStatus(typeToCheck, body.status)) {
        const validStatuses =
          typeToCheck === 'invoice' ? VALID_INVOICE_STATUSES : VALID_QUOTE_STATUSES;
        return NextResponse.json(
          {
            error: `Invalid status for ${typeToCheck}. Valid statuses: ${validStatuses.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    // Validate email if provided
    if (body.clientEmail !== undefined) {
      if (!validateEmail(body.clientEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }
      updateData.clientEmail = body.clientEmail.trim().toLowerCase();
    }

    // Validate items if provided
    if (body.items !== undefined) {
      const itemsValidation = validateItems(body.items);
      if (!itemsValidation.valid) {
        return NextResponse.json(
          { error: itemsValidation.error, code: 'INVALID_ITEMS' },
          { status: 400 }
        );
      }
      updateData.items = JSON.stringify(body.items);
    }

    // Update other fields if provided
    if (body.clientName !== undefined) updateData.clientName = body.clientName.trim();
    if (body.clientAddress !== undefined) updateData.clientAddress = body.clientAddress.trim();
    if (body.clientPhone !== undefined) updateData.clientPhone = body.clientPhone.trim();
    if (body.chantierId !== undefined) updateData.chantierId = body.chantierId;
    if (body.issueDate !== undefined) updateData.issueDate = body.issueDate;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
    if (body.validityDate !== undefined) updateData.validityDate = body.validityDate;
    if (body.subtotal !== undefined) {
      if (typeof body.subtotal !== 'number') {
        return NextResponse.json(
          { error: 'Subtotal must be a number', code: 'INVALID_NUMBER' },
          { status: 400 }
        );
      }
      updateData.subtotal = body.subtotal;
    }
    if (body.taxRate !== undefined) {
      if (typeof body.taxRate !== 'number') {
        return NextResponse.json(
          { error: 'Tax rate must be a number', code: 'INVALID_NUMBER' },
          { status: 400 }
        );
      }
      updateData.taxRate = body.taxRate;
    }
    if (body.taxAmount !== undefined) {
      if (typeof body.taxAmount !== 'number') {
        return NextResponse.json(
          { error: 'Tax amount must be a number', code: 'INVALID_NUMBER' },
          { status: 400 }
        );
      }
      updateData.taxAmount = body.taxAmount;
    }
    if (body.totalAmount !== undefined) {
      if (typeof body.totalAmount !== 'number') {
        return NextResponse.json(
          { error: 'Total amount must be a number', code: 'INVALID_NUMBER' },
          { status: 400 }
        );
      }
      updateData.totalAmount = body.totalAmount;
    }
    if (body.notes !== undefined) updateData.notes = body.notes.trim();
    if (body.terms !== undefined) updateData.terms = body.terms.trim();
    if (body.createdBy !== undefined) updateData.createdBy = body.createdBy;
    if (body.pdfUrl !== undefined) updateData.pdfUrl = body.pdfUrl ? body.pdfUrl.trim() : null;

    const updated = await db
      .update(invoicesQuotes)
      .set(updateData)
      .where(eq(invoicesQuotes.id, recordId))
      .returning();

    // Log update
    await logAudit({
      userId: user.id,
      action: existing[0].type === 'invoice' ? AuditActions.UPDATE_INVOICE : AuditActions.UPDATE_QUOTE,
      resourceType: existing[0].type === 'invoice' ? ResourceTypes.INVOICE : ResourceTypes.QUOTE,
      resourceId: recordId,
      ...metadata,
      details: { 
        changes: Object.keys(updateData).filter(k => k !== 'updatedAt'),
        documentNumber: updated[0].documentNumber,
      },
    });

    return NextResponse.json(updated[0], { status: 200 });
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
    // Only admin/travailleur can delete invoices/quotes
    const authResult = await requireRole(request, ['admin', 'travailleur']);
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

    const recordId = parseInt(id);

    // Check if record exists
    const existing = await db
      .select()
      .from(invoicesQuotes)
      .where(eq(invoicesQuotes.id, recordId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(invoicesQuotes)
      .where(eq(invoicesQuotes.id, recordId))
      .returning();

    // Log deletion
    await logAudit({
      userId: user.id,
      action: deleted[0].type === 'invoice' ? AuditActions.DELETE_INVOICE : AuditActions.DELETE_QUOTE,
      resourceType: deleted[0].type === 'invoice' ? ResourceTypes.INVOICE : ResourceTypes.QUOTE,
      resourceId: recordId,
      ...metadata,
      details: { 
        documentNumber: deleted[0].documentNumber,
        type: deleted[0].type,
        totalAmount: deleted[0].totalAmount,
      },
    });

    return NextResponse.json(
      {
        message: 'Invoice/Quote deleted successfully',
        record: deleted[0],
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