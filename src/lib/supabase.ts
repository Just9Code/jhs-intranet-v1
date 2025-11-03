import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage buckets
export const STORAGE_BUCKETS = {
  CHANTIER_FILES: 'chantier-files',
  USER_PHOTOS: 'user-photos',
  COMPANY_ASSETS: 'company-assets',
} as const;

// Helper function to get public URL for a file
export function getSupabaseFileUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Helper function to upload a file - FIXED: Returns public URL instead of path
export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  // ✅ FIX: Return the public URL, not just the path
  return getSupabaseFileUrl(bucket, data.path);
}

// Helper function to delete a file
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw error;
  }

  return true;
}