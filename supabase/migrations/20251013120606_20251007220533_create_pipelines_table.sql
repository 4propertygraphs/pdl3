/*
  # Create pipelines table

  1. New Tables
    - `pipelines`
      - `id` (bigserial, primary key) - Auto-incrementing ID
      - `name` (text, not null) - Pipeline name
      - `description` (text) - Pipeline description
      - `pipeline_url` (text, not null) - Pipeline URL (max 2083 chars for URL compatibility)
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update
  
  2. Security
    - Enable RLS on `pipelines` table
    - Add policy for authenticated users to read pipelines
    - Add policy for authenticated users to insert pipelines
    - Add policy for authenticated users to update pipelines
    - Add policy for authenticated users to delete pipelines
*/

CREATE TABLE IF NOT EXISTS pipelines (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  description text,
  pipeline_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pipelines"
  ON pipelines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pipelines"
  ON pipelines
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pipelines"
  ON pipelines
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete pipelines"
  ON pipelines
  FOR DELETE
  TO authenticated
  USING (true);