/*
  # Add parent_id and other remaining columns to properties table
  
  1. Changes
    - Add 'parent_id' column (bigint) - reference to parent property
    - Add other potential missing columns
    
  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - Preserves existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'parent_id') THEN
    ALTER TABLE properties ADD COLUMN parent_id bigint;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'reference') THEN
    ALTER TABLE properties ADD COLUMN reference text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'reference_id') THEN
    ALTER TABLE properties ADD COLUMN reference_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'views') THEN
    ALTER TABLE properties ADD COLUMN views integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'active') THEN
    ALTER TABLE properties ADD COLUMN active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'deleted') THEN
    ALTER TABLE properties ADD COLUMN deleted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'deleted_at') THEN
    ALTER TABLE properties ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;
