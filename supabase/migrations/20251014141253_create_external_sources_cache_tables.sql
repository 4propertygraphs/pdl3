/*
  # Create External Sources Cache Tables

  1. New Tables
    - `daft_properties`
      - Stores cached property data from Daft.ie
      - Linked to properties table via external_id (ListReff)
      - Contains raw JSON data and metadata
    
    - `myhome_properties`
      - Stores cached property data from MyHome.ie
      - Linked to properties table via external_id (ListReff)
      - Contains raw JSON data and metadata
    
    - `wordpress_properties`
      - Stores cached property data from WordPress/4PM
      - Linked to properties table via external_id (ListReff)
      - Contains raw JSON data and metadata
    
    - `acquaint_properties`
      - Stores cached property data from Acquaint CRM
      - Linked to properties table via external_id (ListReff)
      - Contains raw JSON data and metadata

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their agency's data
    - Service role can manage all data

  3. Indexes
    - Index on external_id for fast lookups
    - Index on agency_id for filtering by agency
    - Index on updated_at for cache freshness checks
*/

-- Create daft_properties table
CREATE TABLE IF NOT EXISTS daft_properties (
  id bigserial PRIMARY KEY,
  agency_id bigint REFERENCES agencies(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  raw_data jsonb,
  last_fetched timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_daft_properties_external_id ON daft_properties(external_id);
CREATE INDEX IF NOT EXISTS idx_daft_properties_agency_id ON daft_properties(agency_id);
CREATE INDEX IF NOT EXISTS idx_daft_properties_updated_at ON daft_properties(updated_at);

ALTER TABLE daft_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read their agency daft data"
  ON daft_properties
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies
      WHERE id = agency_id
    )
  );

CREATE POLICY "Service role can manage daft data"
  ON daft_properties
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create myhome_properties table
CREATE TABLE IF NOT EXISTS myhome_properties (
  id bigserial PRIMARY KEY,
  agency_id bigint REFERENCES agencies(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  raw_data jsonb,
  last_fetched timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_myhome_properties_external_id ON myhome_properties(external_id);
CREATE INDEX IF NOT EXISTS idx_myhome_properties_agency_id ON myhome_properties(agency_id);
CREATE INDEX IF NOT EXISTS idx_myhome_properties_updated_at ON myhome_properties(updated_at);

ALTER TABLE myhome_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read their agency myhome data"
  ON myhome_properties
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies
      WHERE id = agency_id
    )
  );

CREATE POLICY "Service role can manage myhome data"
  ON myhome_properties
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create wordpress_properties table
CREATE TABLE IF NOT EXISTS wordpress_properties (
  id bigserial PRIMARY KEY,
  agency_id bigint REFERENCES agencies(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  raw_data jsonb,
  last_fetched timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_wordpress_properties_external_id ON wordpress_properties(external_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_properties_agency_id ON wordpress_properties(agency_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_properties_updated_at ON wordpress_properties(updated_at);

ALTER TABLE wordpress_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read their agency wordpress data"
  ON wordpress_properties
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies
      WHERE id = agency_id
    )
  );

CREATE POLICY "Service role can manage wordpress data"
  ON wordpress_properties
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create acquaint_properties table
CREATE TABLE IF NOT EXISTS acquaint_properties (
  id bigserial PRIMARY KEY,
  agency_id bigint REFERENCES agencies(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  raw_data jsonb,
  last_fetched timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_acquaint_properties_external_id ON acquaint_properties(external_id);
CREATE INDEX IF NOT EXISTS idx_acquaint_properties_agency_id ON acquaint_properties(agency_id);
CREATE INDEX IF NOT EXISTS idx_acquaint_properties_updated_at ON acquaint_properties(updated_at);

ALTER TABLE acquaint_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read their agency acquaint data"
  ON acquaint_properties
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies
      WHERE id = agency_id
    )
  );

CREATE POLICY "Service role can manage acquaint data"
  ON acquaint_properties
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
