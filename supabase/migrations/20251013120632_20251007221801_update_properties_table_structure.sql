/*
  # Update properties table to match Flask model structure

  1. Changes
    - Drop existing properties table with JSONB data column
    - Create new properties table with specific columns for property attributes
    - Columns include:
      - agency_agent_name (text) - Agent's name
      - agency_name (text) - Agency name
      - house_location (text) - Property location/address
      - house_price (text) - Property price
      - house_bedrooms (integer) - Number of bedrooms
      - house_bathrooms (integer) - Number of bathrooms
      - house_mt_squared (text) - Property size in square meters
      - house_extra_info_1 to house_extra_info_4 (text) - Additional property information
      - agency_image_url (text) - Agency logo URL
      - images_url_house (text) - Property image URLs
      - agency_id (bigint) - Foreign key to agencies table
      - external_id (text) - External reference ID from source
      - source (text) - Data source (e.g., '4pm', 'daft', 'myhome')

  2. Security
    - Enable RLS on properties table
    - Add policies for authenticated users to read all properties
    - Add policies for authenticated users to insert/update/delete properties
*/

DROP TABLE IF EXISTS properties CASCADE;

CREATE TABLE IF NOT EXISTS properties (
  id bigserial PRIMARY KEY,
  agency_id bigint REFERENCES agencies(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT '4pm',
  external_id text,
  agency_agent_name text,
  agency_name text NOT NULL,
  house_location text NOT NULL,
  house_price text NOT NULL,
  house_bedrooms integer DEFAULT 0,
  house_bathrooms integer DEFAULT 0,
  house_mt_squared text,
  house_extra_info_1 text,
  house_extra_info_2 text,
  house_extra_info_3 text,
  house_extra_info_4 text,
  agency_image_url text,
  images_url_house text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(external_id, agency_id)
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all properties"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_properties_agency_id ON properties(agency_id);
CREATE INDEX IF NOT EXISTS idx_properties_external_id ON properties(external_id);
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);