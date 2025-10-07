/*
  # Add unique constraint to agencies unique_key

  1. Changes
    - Add unique constraint on unique_key to prevent duplicate agencies
    - This allows upsert operations to work correctly when syncing data
  
  2. Security
    - No changes to RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'agencies_unique_key_key'
  ) THEN
    ALTER TABLE agencies 
    ADD CONSTRAINT agencies_unique_key_key 
    UNIQUE (unique_key);
  END IF;
END $$;