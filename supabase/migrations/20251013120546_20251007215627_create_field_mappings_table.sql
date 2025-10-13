/*
  # Create field_mappings table

  1. New Tables
    - `field_mappings`
      - `id` (bigserial, primary key) - Auto-incrementing ID
      - `field_name` (text, not null) - Name of the field being mapped
      - `acquaint_crm` (text) - Field name in Acquaint CRM system
      - `propertydrive` (text) - Field name in PropertyDrive system
      - `daft` (text) - Field name in Daft system
      - `myhome` (text) - Field name in MyHome system
      - `wordpress` (text) - Field name in WordPress system
      - `order` (integer) - Display order in UI
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update
  
  2. Security
    - Enable RLS on `field_mappings` table
    - Add policy for authenticated users to read field mappings
    - Add policy for authenticated users to insert field mappings
    - Add policy for authenticated users to update field mappings
    - Add policy for authenticated users to delete field mappings
*/

CREATE TABLE IF NOT EXISTS field_mappings (
  id bigserial PRIMARY KEY,
  field_name text NOT NULL,
  acquaint_crm text DEFAULT '',
  propertydrive text DEFAULT '',
  daft text DEFAULT '',
  myhome text DEFAULT '',
  wordpress text DEFAULT '',
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read field mappings"
  ON field_mappings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert field mappings"
  ON field_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update field mappings"
  ON field_mappings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete field mappings"
  ON field_mappings
  FOR DELETE
  TO authenticated
  USING (true);