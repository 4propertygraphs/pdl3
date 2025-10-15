/*
  # Add live_status and reorganize market fields

  ## Summary
  This migration reorganizes property market and status fields:
  
  ## Changes Made
  
  1. **New Column**
     - `live_status` (text) - Will store the current live status of the property
  
  2. **Data Migration**
     - Copy data from `status` → `live_status` (preserves current status values)
     - Copy data from `propertymarket` → `status` (moves market type like "For Sale", "To Let" to status)
     - Convert `propertymarket` values to standardized market categories:
       - Properties with "commercial" or "Commercial" → "commercial"
       - All other properties → "residential"
  
  3. **Column Updates**
     - Rename `propertymarket` to `market`
     - Set default value for `market` as 'residential'
  
  ## Important Notes
  - No data is lost - all existing values are preserved in new locations
  - The `market` field now clearly distinguishes residential vs commercial properties
  - The `status` field now contains the sale/rental type (e.g., "For Sale", "To Let")
  - The `live_status` field contains property availability status
*/

DO $$
BEGIN
  -- Step 1: Add live_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'live_status'
  ) THEN
    ALTER TABLE properties ADD COLUMN live_status text;
  END IF;

  -- Step 2: Migrate data from status to live_status
  UPDATE properties
  SET live_status = status
  WHERE live_status IS NULL AND status IS NOT NULL;

  -- Step 3: Migrate data from propertymarket to status
  UPDATE properties
  SET status = propertymarket
  WHERE propertymarket IS NOT NULL;

  -- Step 4: Update propertymarket values to be either 'residential' or 'commercial'
  UPDATE properties
  SET propertymarket = CASE
    WHEN LOWER(propertymarket) LIKE '%commercial%' THEN 'commercial'
    ELSE 'residential'
  END
  WHERE propertymarket IS NOT NULL;

  -- Set default for NULL values
  UPDATE properties
  SET propertymarket = 'residential'
  WHERE propertymarket IS NULL;

  -- Step 5: Rename propertymarket to market if not already renamed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'propertymarket'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'market'
  ) THEN
    ALTER TABLE properties RENAME COLUMN propertymarket TO market;
  END IF;

  -- Step 6: Set default value for market column
  ALTER TABLE properties ALTER COLUMN market SET DEFAULT 'residential';
END $$;
