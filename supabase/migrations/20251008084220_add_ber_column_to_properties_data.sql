/*
  # Add BER column to properties_data

  ## Overview
  Adds the missing `ber` column to properties_data table.

  ## Changes
  - Add `ber` (text) column to store Building Energy Rating

  ## Notes
  - Column allows NULL values for flexibility
*/

-- Add ber column to properties_data table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'ber') THEN
    ALTER TABLE properties_data ADD COLUMN ber text;
  END IF;
END $$;
