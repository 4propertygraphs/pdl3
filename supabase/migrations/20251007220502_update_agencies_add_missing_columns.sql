/*
  # Update agencies table structure

  1. Changes
    - Add missing columns to agencies table:
      - address1 (text) - First line of address
      - address2 (text) - Second line of address
      - logo (text) - URL to agency logo
      - site_name (text) - Acquaint site name
      - site_prefix (text) - Acquaint site prefix
      - myhome_group_id (integer) - MyHome group ID
      - fourpm_branch_id (integer) - 4PM branch ID
      - ghl_id (text) - GoHighLevel ID
      - whmcs_id (text) - WHMCS ID
    
  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - All new columns are nullable to preserve existing data
*/

-- Add address1 column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'address1'
  ) THEN
    ALTER TABLE agencies ADD COLUMN address1 text;
  END IF;
END $$;

-- Add address2 column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'address2'
  ) THEN
    ALTER TABLE agencies ADD COLUMN address2 text;
  END IF;
END $$;

-- Add logo column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'logo'
  ) THEN
    ALTER TABLE agencies ADD COLUMN logo text;
  END IF;
END $$;

-- Add site_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'site_name'
  ) THEN
    ALTER TABLE agencies ADD COLUMN site_name text;
  END IF;
END $$;

-- Add site_prefix column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'site_prefix'
  ) THEN
    ALTER TABLE agencies ADD COLUMN site_prefix text;
  END IF;
END $$;

-- Add myhome_group_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'myhome_group_id'
  ) THEN
    ALTER TABLE agencies ADD COLUMN myhome_group_id integer;
  END IF;
END $$;

-- Add fourpm_branch_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'fourpm_branch_id'
  ) THEN
    ALTER TABLE agencies ADD COLUMN fourpm_branch_id integer;
  END IF;
END $$;

-- Add ghl_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'ghl_id'
  ) THEN
    ALTER TABLE agencies ADD COLUMN ghl_id text;
  END IF;
END $$;

-- Add whmcs_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'whmcs_id'
  ) THEN
    ALTER TABLE agencies ADD COLUMN whmcs_id text;
  END IF;
END $$;