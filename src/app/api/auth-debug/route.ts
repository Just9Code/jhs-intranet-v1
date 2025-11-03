import { NextResponse } from 'next/server';

// Endpoint de debug désactivé
export async function GET() {
  return NextResponse.json({ message: 'Debug endpoint disabled' }, { status: 404 });
}
