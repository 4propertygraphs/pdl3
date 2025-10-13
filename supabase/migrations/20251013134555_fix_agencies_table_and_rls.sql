/*
  # Fix agencies table structure and add RLS

  1. Changes
    - Add missing `site_prefix` column to agencies table
    - Enable Row Level Security (RLS) on agencies table
    - Add policy to allow public read access to agencies
    - Add policies for service role to manage agencies
  
  2. Security
    - Enable RLS on agencies table
    - Public users can read all agencies
    - Service role can insert, update, and delete agencies
*/

-- Add site_prefix column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'site_prefix'
  ) THEN
    ALTER TABLE agencies ADD COLUMN site_prefix text;
  END IF;
END $$;

-- Enable RLS on agencies table
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read agencies" ON agencies;
DROP POLICY IF EXISTS "Service role can insert agencies" ON agencies;
DROP POLICY IF EXISTS "Service role can update agencies" ON agencies;
DROP POLICY IF EXISTS "Service role can delete agencies" ON agencies;

-- Allow public read access to all agencies
CREATE POLICY "Anyone can read agencies"
  ON agencies
  FOR SELECT
  TO public
  USING (true);

-- Allow service role to insert agencies
CREATE POLICY "Service role can insert agencies"
  ON agencies
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to update agencies
CREATE POLICY "Service role can update agencies"
  ON agencies
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to delete agencies
CREATE POLICY "Service role can delete agencies"
  ON agencies
  FOR DELETE
  TO service_role
  USING (true);