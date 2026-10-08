-- Let the admin server store cover images in the public blog-images bucket.
-- The website reads the https URL from blog_posts.image, so Apache does not
-- need a separate copy of the file.

UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'blog-images';

DROP POLICY IF EXISTS "Anon upload blog images" ON storage.objects;
CREATE POLICY "Anon upload blog images"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'blog-images'
    AND name LIKE 'covers/%'
  );
