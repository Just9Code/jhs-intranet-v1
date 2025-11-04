import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, STORAGE_BUCKETS } from '@/lib/supabase';
import { requireAuth, canAccessChantier } from '@/lib/rbac';
import { logAudit, AuditActions, ResourceTypes } from '@/lib/audit-logger';

// Helper to extract IP and User-Agent
function getRequestMetadata(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const metadata = getRequestMetadata(request);
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const bucket = searchParams.get('bucket') || STORAGE_BUCKETS.CHANTIER_FILES;
    const chantierId = searchParams.get('chantierId');

    if (!path) {
      return NextResponse.json(
        { error: 'File path is required', code: 'NO_PATH' },
        { status: 400 }
      );
    }

    // For clients: verify they can access this chantier
    if (chantierId && user.role === 'client') {
      const hasAccess = await canAccessChantier(user, parseInt(chantierId));
      if (!hasAccess) {
        await logAudit({
          userId: user.id,
          action: AuditActions.DELETE_FILE,
          resourceType: ResourceTypes.FILE,
          ...metadata,
          details: { error: 'Access denied to chantier', chantierId, path, role: user.role },
        });

        return NextResponse.json(
          { error: 'Accès refusé - Ce chantier ne vous appartient pas', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    await deleteFile(bucket, path);

    // Log deletion
    await logAudit({
      userId: user.id,
      action: AuditActions.DELETE_FILE,
      resourceType: ResourceTypes.FILE,
      resourceId: chantierId ? parseInt(chantierId) : undefined,
      ...metadata,
      details: { 
        path,
        bucket,
        chantierId,
      },
    });

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