import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, STORAGE_BUCKETS } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const bucket = searchParams.get('bucket') || STORAGE_BUCKETS.CHANTIER_FILES;

    if (!path) {
      return NextResponse.json(
        { error: 'File path is required', code: 'NO_PATH' },
        { status: 400 }
      );
    }

    await deleteFile(bucket, path);

    return NextResponse.json(
      { success: true, message: 'File deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed: ' + (error as Error).message, code: 'DELETE_FAILED' },
      { status: 500 }
    );
  }
}
