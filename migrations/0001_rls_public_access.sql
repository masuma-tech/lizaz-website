-- Enable RLS and allow the public (anon) key to power the static site
-- without a Node server. Run this in the Supabase SQL editor.

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Public can read published blog posts only
DROP POLICY IF EXISTS "Public read published blogs" ON blog_posts;
CREATE POLICY "Public read published blogs"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Contacts: no public insert/select via anon key.
-- Submissions go through the send-contact-email Edge Function (service role + Resend).
DROP POLICY IF EXISTS "Public insert contacts" ON contacts;

-- Lock down users: no public access (admin stays server-side / Supabase Auth later)
-- With RLS enabled and no policies for anon, users/contacts are inaccessible via the anon key.
