/*
  # Create sites table

  1. New Tables
    - `sites`
      - `id` (bigserial, primary key) - Auto-incrementing ID
      - `tag` (text, not null) - Site tag
      - `site_id` (integer, not null) - Site ID
      - `value` (text, not null) - Site value
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update
  
  2. Security
    - Enable RLS on `sites` table
    - Add policy for authenticated users to read sites
    - Add policy for authenticated users to insert sites
    - Add policy for authenticated users to update sites
    - Add policy for authenticated users to delete sites
*/

CREATE TABLE IF NOT EXISTS sites (
  id bigserial PRIMARY KEY,
  tag text NOT NULL,
  site_id integer NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sites"
  ON sites
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sites"
  ON sites
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sites"
  ON sites
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sites"
  ON sites
  FOR DELETE
  TO authenticated
  USING (true);