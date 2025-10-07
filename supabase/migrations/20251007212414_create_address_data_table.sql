/*
  # Create address_data table for property listings

  1. New Tables
    - `address_data`
      - `id` (integer, primary key, auto-increment)
      - `address` (text) - Full property address
      - `latitude` (numeric) - GPS latitude coordinate
      - `longitude` (numeric) - GPS longitude coordinate
      - `price` (integer) - Property price
      - `usable_area` (numeric) - Usable area in square meters
      - `url` (text) - URL to property listing
      - `image_url` (text) - URL to property image
      - `description` (text) - Property description
      - `floor_area` (numeric) - Floor area in square meters
      - `plot_area` (numeric) - Plot area in square meters
      - `object_type` (text) - Type of property (apartment, house, etc.)
      - `object_sub_type` (text) - Subtype of property
      - `ownership` (text) - Type of ownership
      - `object_condition` (text) - Condition of property
      - `building_type` (text) - Type of building
      - `energy_efficiency_rating` (character) - Energy rating (A-G)
      - `last_update` (timestamp) - Last update timestamp
      - `created_at` (timestamp) - Record creation timestamp
      - `source` (text) - Data source (bezrealitky, sreality, etc.)
      
  2. Security
    - Enable RLS on `address_data` table
    - Add policy for authenticated users to read all property data
    - Add policy for authenticated users to insert property data
    - Add policy for authenticated users to update property data
    - Add policy for authenticated users to delete property data
    
  3. Notes
    - This table stores property listings from various real estate sources
    - Data includes location, pricing, specifications, and metadata
*/

CREATE TABLE IF NOT EXISTS address_data (
  id SERIAL PRIMARY KEY,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  price INTEGER,
  usable_area NUMERIC,
  url TEXT,
  image_url TEXT,
  description TEXT,
  floor_area NUMERIC,
  plot_area NUMERIC,
  object_type TEXT,
  object_sub_type TEXT,
  ownership TEXT,
  object_condition TEXT,
  building_type TEXT,
  energy_efficiency_rating CHAR(1),
  last_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  source TEXT
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