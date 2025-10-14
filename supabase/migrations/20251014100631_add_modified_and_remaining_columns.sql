/*
  # Add modified and other missing columns to properties table
  
  1. Changes
    - Add 'modified' column (timestamp) - last modification time
    - Add any other commonly used columns from old database
    
  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - Preserves existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'modified') THEN
    ALTER TABLE properties ADD COLUMN modified timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'posted') THEN
    ALTER TABLE properties ADD COLUMN posted timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'status') THEN
    ALTER TABLE properties ADD COLUMN status text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'featured') THEN
    ALTER TABLE properties ADD COLUMN featured boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'address') THEN
    ALTER TABLE properties ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'county') THEN
    ALTER TABLE properties ADD COLUMN county text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'city') THEN
    ALTER TABLE properties ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'postal_code') THEN
    ALTER TABLE properties ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'latitude') THEN
    ALTER TABLE properties ADD COLUMN latitude numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'longitude') THEN
    ALTER TABLE properties ADD COLUMN longitude numeric;
  END IF;
END $$;
