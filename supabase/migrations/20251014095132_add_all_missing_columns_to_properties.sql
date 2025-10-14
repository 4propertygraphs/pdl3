/*
  # Add all missing columns to properties table from old database
  
  1. Changes
    - Add 'beds' column (integer) - number of bedrooms
    - Add 'baths' column (integer) - number of bathrooms  
    - Add 'sqm' column (text) - square meters
    - Add 'ber' column (text) - energy rating
    - Add 'price' column (text) - property price
    - Add 'location' column (text) - property location
    - Add 'agent' column (text) - agent name
    - Add 'agent_name' column (text) - agent name variant
    - Add 'property_type' column (text) - type of property
    - Add 'sale_type' column (text) - sale or rent
    - Add 'image_url' column (text) - main image URL
    - Add 'images' column (text) - JSON array of images
    - Add 'description' column (text) - property description
    - Add 'url' column (text) - property URL
    - Add 'extra_info_1' through 'extra_info_4' columns (text)
    
  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - Preserves existing data
    - Covers all possible column variations from old schema
*/

DO $$
BEGIN
  -- Basic property info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'beds') THEN
    ALTER TABLE properties ADD COLUMN beds integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'baths') THEN
    ALTER TABLE properties ADD COLUMN baths integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'sqm') THEN
    ALTER TABLE properties ADD COLUMN sqm text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'ber') THEN
    ALTER TABLE properties ADD COLUMN ber text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'price') THEN
    ALTER TABLE properties ADD COLUMN price text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'location') THEN
    ALTER TABLE properties ADD COLUMN location text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'agent') THEN
    ALTER TABLE properties ADD COLUMN agent text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'agent_name') THEN
    ALTER TABLE properties ADD COLUMN agent_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'property_type') THEN
    ALTER TABLE properties ADD COLUMN property_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'sale_type') THEN
    ALTER TABLE properties ADD COLUMN sale_type text;
  END IF;

  -- Images and media
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'image_url') THEN
    ALTER TABLE properties ADD COLUMN image_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'images') THEN
    ALTER TABLE properties ADD COLUMN images text;
  END IF;

  -- Description and URL
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'description') THEN
    ALTER TABLE properties ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'url') THEN
    ALTER TABLE properties ADD COLUMN url text;
  END IF;

  -- Extra info fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'extra_info_1') THEN
    ALTER TABLE properties ADD COLUMN extra_info_1 text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'extra_info_2') THEN
    ALTER TABLE properties ADD COLUMN extra_info_2 text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'extra_info_3') THEN
    ALTER TABLE properties ADD COLUMN extra_info_3 text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'extra_info_4') THEN
    ALTER TABLE properties ADD COLUMN extra_info_4 text;
  END IF;
END $$;
