/*
  # Create connectors table

  1. New Tables
    - `connectors`
      - `id` (bigserial, primary key) - Auto-incrementing ID
      - `name` (text, unique, not null) - Connector name
      - `connector_config_fields` (jsonb, not null) - Configuration fields stored as JSON
      - `description` (text) - Connector description
      - `type` (text, not null) - Connector type (IN or OUT)
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update
  
  2. Security
    - Enable RLS on `connectors` table
    - Add policy for authenticated users to read connectors
    - Add policy for authenticated users to insert connectors
    - Add policy for authenticated users to update connectors
    - Add policy for authenticated users to delete connectors
  
  3. Constraints
    - type must be either 'IN' or 'OUT'
*/

CREATE TABLE IF NOT EXISTS connectors (
  id bigserial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  connector_config_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  type text NOT NULL CHECK (type IN ('IN', 'OUT')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read connectors"
  ON connectors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert connectors"
  ON connectors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update connectors"
  ON connectors
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete connectors"
  ON connectors
  FOR DELETE
  TO authenticated
  USING (true);