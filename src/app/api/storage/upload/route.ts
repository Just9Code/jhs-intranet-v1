import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/supabase';
import { requireAuth, requirePermission } from '@/lib/rbac';
import { rateLimitAPI, getClientIP } from '@/lib/rate-limit';
import { logAudit, AuditActions, ResourceTypes } from '@/lib/audit-logger';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  videos: ['video/mp4', 'video/webm', 'video/quicktime'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // ✅ Rate limiting
  const rateLimit = rateLimitAPI(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez plus tard.', code: 'RATE_LIMIT_EXCEEDED' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.reset).toISOString(),
        },
      }
    );
  }

  // ✅ RBAC: Require authentication and uploadFile permission
  const permCheck = await requirePermission(request, 'uploadFile');
  if (permCheck instanceof NextResponse) return permCheck;
  const { user: currentUser } = permCheck;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || STORAGE_BUCKETS.CHANTIER_FILES;
    const chantierId = formData.get('chantierId') as string;
    const fileType = formData.get('fileType') as string;

    // ✅ Validation - No file provided
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // ✅ Validation - File size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // ✅ Validation - File type
    const allAllowedTypes = [...ALLOWED_MIME_TYPES.images, ...ALLOWED_MIME_TYPES.videos, ...ALLOWED_MIME_TYPES.documents];
    if (!allAllowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type', code: 'INVALID_FILE_TYPE', allowedTypes: allAllowedTypes },
        { status: 400 }
      );
    }

    // ✅ Sanitize filename - prevent path traversal
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '');

    if (!sanitizedName || sanitizedName.length === 0) {
      return NextResponse.json(
        { error: 'Invalid filename', code: 'INVALID_FILENAME' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = sanitizedName.split('.').pop();
    
    let filePath: string;
    if (chantierId) {
      // Validate chantierId is numeric
      if (isNaN(parseInt(chantierId))) {
        return NextResponse.json(
          { error: 'Invalid chantierId', code: 'INVALID_CHANTIER_ID' },
          { status: 400 }
        );
      }
      filePath = `chantier_${chantierId}/${fileType || 'general'}/${timestamp}_${randomStr}_${sanitizedName}`;
    } else {
      filePath = `uploads/${timestamp}_${randomStr}_${sanitizedName}`;
    }

    // Upload to Supabase Storage
    const publicUrl = await uploadFile(bucket, filePath, file);

    // ✅ Audit log
    await logAudit({
      userId: currentUser.id,
      action: AuditActions.UPLOAD_FILE,
      resourceType: ResourceTypes.FILE,
      resourceId: chantierId ? parseInt(chantierId) : undefined,
      ipAddress: ip,
      userAgent,
      details: {
        fileName: sanitizedName,
        fileSize: file.size,
        fileType: file.type,
        bucket,
        path: filePath,
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
    console.error('❌ [UPLOAD] Upload error:', error);
    
    // ✅ Audit log for failed upload
    await logAudit({
      userId: currentUser.id,
      action: 'UPLOAD_FILE_FAILED',
      resourceType: ResourceTypes.FILE,
      ipAddress: ip,
      userAgent,
      details: {
        error: (error as Error).message,
      },
    });

    return NextResponse.json(
      { error: 'Upload failed: ' + (error as Error).message, code: 'UPLOAD_FAILED' },
      { status: 500 }
    );
  }
}