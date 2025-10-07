/*
  # Update address_data table structure
  
  1. Changes
    - Drop existing address_data table
    - Create new address_data table with correct structure matching the SQL dump
    
  2. New Structure
    - `index` (bigint) - Index number
    - `county` (text) - County name
    - `region` (text) - Region name
    - `area` (text) - Area name
    - `price` (bigint) - Property price
    - `beds` (double precision) - Number of bedrooms
    - `rawAddress` (text) - Raw address string
    - `sqrMetres` (double precision) - Square meters
    - `pricePerSqrMetres` (double precision) - Price per square meter
    - `street` (text) - Street name
    - `streetNumber` (text) - Street number
    - `eircode` (text) - Eircode (postal code)
    - `houseNoStreet` (text) - House number and street
    - `neighborhood` (text) - Neighborhood name
    - `saleDate` (timestamp) - Sale date
    - `location` (text) - Location description
    
  3. Security
    - Enable RLS on address_data table
    - Add policy for authenticated users to read all property data
    - Add policy for authenticated users to insert property data
    - Add policy for authenticated users to update property data
    - Add policy for authenticated users to delete property data
*/

DROP TABLE IF EXISTS address_data;

CREATE TABLE address_data (
  "index" BIGINT,
  county TEXT,
  region TEXT,
  area TEXT,
  price BIGINT,
  beds DOUBLE PRECISION,
  "rawAddress" TEXT,
  "sqrMetres" DOUBLE PRECISION,
  "pricePerSqrMetres" DOUBLE PRECISION,
  street TEXT,
  "streetNumber" TEXT,
  eircode TEXT,
  "houseNoStreet" TEXT,
  neighborhood TEXT,
  "saleDate" TIMESTAMP,
  location TEXT
);

ALTER TABLE address_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read property data"
  ON address_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert property data"
  ON address_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update property data"
  ON address_data FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete property data"
  ON address_data FOR DELETE
  TO authenticated
  USING (true);