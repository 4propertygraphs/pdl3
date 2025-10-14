/*
  # Add all remaining columns to properties table based on old schema
  
  1. Changes
    - Add all missing columns from the old database schema
    - Covers: house_*, size_*, pics, type, propertymarket, raw_data, etc.
    
  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - Preserves existing data
*/

DO $$
BEGIN
  -- House-related columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'house_location') THEN
    ALTER TABLE properties ADD COLUMN house_location text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'house_price') THEN
    ALTER TABLE properties ADD COLUMN house_price text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'house_bedrooms') THEN
    ALTER TABLE properties ADD COLUMN house_bedrooms text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'house_bathrooms') THEN
    ALTER TABLE properties ADD COLUMN house_bathrooms text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'house_mt_squared') THEN
    ALTER TABLE properties ADD COLUMN house_mt_squared text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'house_extra_info_1') THEN
    ALTER TABLE properties ADD COLUMN house_extra_info_1 text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'house_extra_info_2') THEN
    ALTER TABLE properties ADD COLUMN house_extra_info_2 text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'house_extra_info_3') THEN
    ALTER TABLE properties ADD COLUMN house_extra_info_3 text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'house_extra_info_4') THEN
    ALTER TABLE properties ADD COLUMN house_extra_info_4 text;
  END IF;

  -- Agency columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'agency_agent_name') THEN
    ALTER TABLE properties ADD COLUMN agency_agent_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'agency_name') THEN
    ALTER TABLE properties ADD COLUMN agency_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'agency_image_url') THEN
    ALTER TABLE properties ADD COLUMN agency_image_url text;
  END IF;

  -- Images
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'images_url_house') THEN
    ALTER TABLE properties ADD COLUMN images_url_house text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'pics') THEN
    ALTER TABLE properties ADD COLUMN pics text;
  END IF;

  -- Size columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'size') THEN
    ALTER TABLE properties ADD COLUMN size text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'size_in_acres') THEN
    ALTER TABLE properties ADD COLUMN size_in_acres text;
  END IF;

  -- Type and market
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'type') THEN
    ALTER TABLE properties ADD COLUMN type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'propertymarket') THEN
    ALTER TABLE properties ADD COLUMN propertymarket text;
  END IF;

  -- Raw data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'raw_data') THEN
    ALTER TABLE properties ADD COLUMN raw_data text;
  END IF;

  -- Baths (if not already added)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'baths') THEN
    ALTER TABLE properties ADD COLUMN baths text;
  END IF;
END $$;
