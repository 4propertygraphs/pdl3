/*
  # Add username column to users table

  1. Changes
    - Add username column to users table
      - username (text, unique, not null) - User's username
  
  2. Notes
    - Uses IF NOT EXISTS to safely add column
    - Adds unique constraint on username
*/

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username text UNIQUE;
  END IF;
END $$;