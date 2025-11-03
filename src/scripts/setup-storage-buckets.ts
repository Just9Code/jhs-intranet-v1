/**
 * Script to initialize Supabase Storage buckets
 * 
 * Run this script once to create the required storage buckets in Supabase.
 * 
 * NOTE: You need to run this manually in Supabase Dashboard or via SQL:
 * 
 * 1. Go to Supabase Dashboard > Storage
 * 2. Create these buckets with Public access:
 *    - chantier-files (for construction site files)
 *    - user-photos (for user profile photos)
 *    - company-assets (for company logos/assets)
 * 
 * 3. Set bucket policies to allow public read access:
 * 
 * For each bucket, run this SQL in Supabase SQL Editor:
 * 
 * ```sql
 * -- Allow public read access
 * CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'chantier-files');
 * CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'user-photos');
 * CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets');
 * 
 * -- Allow authenticated users to upload
 * CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chantier-files');
 * CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-photos');
 * CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-assets');
 * 
 * -- Allow authenticated users to delete their own files
 * CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chantier-files');
 * CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'user-photos');
 * CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'company-assets');
 * ```
 * 
 * 4. For easier setup, you can also create buckets with public access via the UI:
 *    - Click "New Bucket"
 *    - Name: chantier-files
 *    - Public bucket: YES
 *    - Repeat for user-photos and company-assets
 */

import { supabase, STORAGE_BUCKETS } from '@/lib/supabase';

async function setupStorageBuckets() {
  console.log('🚀 Setting up Supabase Storage Buckets...\n');

  const buckets = [
    { id: STORAGE_BUCKETS.CHANTIER_FILES, name: 'Chantier Files', public: true },
    { id: STORAGE_BUCKETS.USER_PHOTOS, name: 'User Photos', public: true },
    { id: STORAGE_BUCKETS.COMPANY_ASSETS, name: 'Company Assets', public: true },
  ];

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const bucketExists = existingBuckets?.some((b) => b.id === bucket.id);

      if (bucketExists) {
        console.log(`✅ Bucket "${bucket.name}" (${bucket.id}) already exists`);
      } else {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: 52428800, // 50MB
        });

        if (error) {
          console.error(`❌ Error creating bucket "${bucket.name}":`, error.message);
        } else {
          console.log(`✅ Created bucket "${bucket.name}" (${bucket.id})`);
        }
      }
    } catch (error) {
      console.error(`❌ Error with bucket "${bucket.name}":`, (error as Error).message);
    }
  }

  console.log('\n✨ Storage setup complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Go to Supabase Dashboard > Storage');
  console.log('   2. Verify buckets are created');
  console.log('   3. Configure bucket policies (see comments above)');
  console.log('   4. Start uploading files!\n');
}

// Run if called directly
if (require.main === module) {
  setupStorageBuckets()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default setupStorageBuckets;
