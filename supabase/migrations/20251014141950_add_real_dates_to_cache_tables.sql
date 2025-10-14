/*
  # Add Real API Dates to Cache Tables

  1. Changes to Cache Tables
    - Add `api_created_at` column - stores the real creation date from external API
    - Add `api_modified_at` column - stores the real last modified date from external API
    - Keep existing `last_fetched`, `created_at`, `updated_at` for our own tracking

  2. Notes
    - `api_created_at` and `api_modified_at` are nullable (external APIs might not have these fields)
    - These fields help us track when properties actually changed in external systems
    - Our system timestamps (`last_fetched`, etc.) remain for cache management
*/

-- Add API date columns to daft_properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daft_properties' AND column_name = 'api_created_at'
  ) THEN
    ALTER TABLE daft_properties ADD COLUMN api_created_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daft_properties' AND column_name = 'api_modified_at'
  ) THEN
    ALTER TABLE daft_properties ADD COLUMN api_modified_at timestamptz;
  END IF;
END $$;

-- Add API date columns to myhome_properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myhome_properties' AND column_name = 'api_created_at'
  ) THEN
    ALTER TABLE myhome_properties ADD COLUMN api_created_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myhome_properties' AND column_name = 'api_modified_at'
  ) THEN
    ALTER TABLE myhome_properties ADD COLUMN api_modified_at timestamptz;
  END IF;
END $$;

-- Add API date columns to wordpress_properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wordpress_properties' AND column_name = 'api_created_at'
  ) THEN
    ALTER TABLE wordpress_properties ADD COLUMN api_created_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wordpress_properties' AND column_name = 'api_modified_at'
  ) THEN
    ALTER TABLE wordpress_properties ADD COLUMN api_modified_at timestamptz;
  END IF;
END $$;

-- Add API date columns to acquaint_properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'acquaint_properties' AND column_name = 'api_created_at'
  ) THEN
    ALTER TABLE acquaint_properties ADD COLUMN api_created_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'acquaint_properties' AND column_name = 'api_modified_at'
  ) THEN
    ALTER TABLE acquaint_properties ADD COLUMN api_modified_at timestamptz;
  END IF;
END $$;

-- Create indexes on api_modified_at for efficient change detection
CREATE INDEX IF NOT EXISTS idx_daft_properties_api_modified ON daft_properties(api_modified_at);
CREATE INDEX IF NOT EXISTS idx_myhome_properties_api_modified ON myhome_properties(api_modified_at);
CREATE INDEX IF NOT EXISTS idx_wordpress_properties_api_modified ON wordpress_properties(api_modified_at);
CREATE INDEX IF NOT EXISTS idx_acquaint_properties_api_modified ON acquaint_properties(api_modified_at);
