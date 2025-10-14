/*
  # Add missing columns to properties table
  
  1. Changes
    - Add 'agent' column (text) - agent name/identifier from old database
    - Add any other missing columns that exist in old database
    
  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - Preserves existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'agent'
  ) THEN
    ALTER TABLE properties ADD COLUMN agent text;
  END IF;
END $$;
