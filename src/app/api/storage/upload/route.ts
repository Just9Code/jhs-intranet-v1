import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/supabase';
import { requireAuth, canAccessChantier } from '@/lib/rbac';
import { logAudit, AuditActions, ResourceTypes } from '@/lib/audit-logger';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  videos: ['video/mp4', 'video/webm', 'video/quicktime'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Helper to extract IP and User-Agent
function getRequestMetadata(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const metadata = getRequestMetadata(request);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || STORAGE_BUCKETS.CHANTIER_FILES;
    const chantierId = formData.get('chantierId') as string;
    const fileType = formData.get('fileType') as string;

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // Check file type
    const allAllowedTypes = [...ALLOWED_MIME_TYPES.images, ...ALLOWED_MIME_TYPES.videos, ...ALLOWED_MIME_TYPES.documents];
    if (!allAllowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // For clients: verify they can access this chantier
    if (chantierId && user.role === 'client') {
      const hasAccess = await canAccessChantier(user, parseInt(chantierId));
      if (!hasAccess) {
        await logAudit({
          userId: user.id,
          action: AuditActions.UPLOAD_FILE,
          resourceType: ResourceTypes.FILE,
          ...metadata,
          details: { error: 'Access denied to chantier', chantierId, role: user.role },
        });

        return NextResponse.json(
          { error: 'Accès refusé - Ce chantier ne vous appartient pas', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    let filePath: string;
    if (chantierId) {
      filePath = `chantier_${chantierId}/${fileType || 'general'}/${timestamp}_${randomStr}_${sanitizedName}`;
    } else {
      filePath = `uploads/${timestamp}_${randomStr}_${sanitizedName}`;
    }

    // Upload to Supabase Storage
    const publicUrl = await uploadFile(bucket, filePath, file);

    // Log upload
    await logAudit({
      userId: user.id,
      action: AuditActions.UPLOAD_FILE,
      resourceType: ResourceTypes.FILE,
      resourceId: chantierId ? parseInt(chantierId) : undefined,
      ...metadata,
      details: { 
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        bucket,
        chantierId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        path: filePath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed: ' + (error as Error).message, code: 'UPLOAD_FAILED' },
      { status: 500 }
    );
  }
}