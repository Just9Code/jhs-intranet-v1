import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoicesQuotes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Validate type parameter
    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (type !== 'invoice' && type !== 'quote') {
      return NextResponse.json(
        { error: 'Type must be either "invoice" or "quote"', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Query all documents of the specified type
    const documents = await db
      .select()
      .from(invoicesQuotes)
      .where(eq(invoicesQuotes.type, type));

    // Determine prefix based on type
    const prefix = type === 'invoice' ? 'FAC-' : 'DEV-';
    const pattern = type === 'invoice' ? /^FAC-(\d+)$/ : /^DEV-(\d+)$/;

    // Extract and find the highest document number
    let maxNumber = 0;

    for (const doc of documents) {
      const match = doc.documentNumber.match(pattern);
      if (match && match[1]) {
        const number = parseInt(match[1], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    }

    // Increment by 1 and format with leading zeros
    const nextNumber = maxNumber + 1;
    const formattedNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}`;

    return NextResponse.json({
      nextNumber: formattedNumber,
      type: type
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}