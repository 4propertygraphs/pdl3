/*
  # Add WordPress column and order to field_mappings table

  1. Changes
    - Add `wordpress` column to store WordPress field mappings
    - Add `order` column to control display order in UI
    - Set default order based on existing id values

  2. Notes
    - Existing data will get order values based on their id
    - WordPress column starts empty for all existing records
*/

-- Add wordpress column
ALTER TABLE field_mappings 
ADD COLUMN IF NOT EXISTS wordpress text DEFAULT '';

-- Add order column
ALTER TABLE field_mappings 
ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

-- Update order for existing records based on their id
UPDATE field_mappings 
SET "order" = id - 1
WHERE "order" = 0;