/*
  # Create properties_data table for storing detailed property information

  ## Overview
  This table stores all raw property data from external APIs (MyHome, Daft, Acquaint).
  It preserves the complete data structure from each source as JSONB for flexibility.

  ## New Tables
  
  ### `properties_data`
  Stores comprehensive property details from external APIs:
  - `id` (uuid, primary key) - Internal unique identifier
  - `agency_id` (integer, foreign key) - References agencies table
  - `external_id` (text) - Property ID from external API
  - `source` (text) - Data source (myhome, daft, acquaint)
  - `raw_data` (jsonb) - Complete raw data from API
  - `address` (text) - Property address
  - `price` (text) - Property price
  - `beds` (integer) - Number of bedrooms
  - `size` (text) - Property size
  - `size_in_acres` (text) - Property size in acres
  - `property_type` (text) - Type of property
  - `status` (text) - Property status
  - `agent` (text) - Agent name
  - `pics` (jsonb) - Array of image URLs
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Indexes
  - Primary key on `id`
  - Unique constraint on `agency_id, external_id` to prevent duplicates
  - Index on `agency_id` for fast agency lookups
  - Index on `source` for filtering by data source
  - Foreign key to `agencies(id)` with cascade delete

  ## Security
  - Enable RLS on `properties_data` table
  - Add policy for authenticated users to read all properties data
  - Add policy for authenticated users to insert properties data
  - Add policy for authenticated users to update properties data
  - Add policy for authenticated users to delete properties data

  ## Notes
  - Uses JSONB for `raw_data` to store flexible API responses
  - Uses JSONB for `pics` to store array of image URLs
  - Timestamps automatically track record changes
*/

CREATE TABLE IF NOT EXISTS properties_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id integer NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  source text NOT NULL DEFAULT 'unknown',
  raw_data jsonb DEFAULT '{}'::jsonb,
  address text DEFAULT '',
  price text DEFAULT '',
  beds integer,
  size text DEFAULT '',
  size_in_acres text DEFAULT '',
  property_type text DEFAULT '',
  status text DEFAULT '',
  agent text DEFAULT '',
  pics jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS properties_data_agency_external_id_key 
  ON properties_data(agency_id, external_id);

CREATE INDEX IF NOT EXISTS properties_data_agency_id_idx ON properties_data(agency_id);
CREATE INDEX IF NOT EXISTS properties_data_source_idx ON properties_data(source);

ALTER TABLE properties_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all properties data"
  ON properties_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert properties data"
  ON properties_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update properties data"
  ON properties_data FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete properties data"
  ON properties_data FOR DELETE
  TO authenticated
  USING (true);