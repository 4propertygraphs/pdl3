/*
  # Add stefanmars API token to users table

  1. Changes
    - Add `stefanmars_api_token` column to users table
    - This allows each user to have their own stefanmars API token
  
  2. Notes
    - Token is nullable - not all users may have stefanmars access
    - Token should be kept secure and not exposed to client side
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'stefanmars_api_token'
  ) THEN
    ALTER TABLE users ADD COLUMN stefanmars_api_token text;
  END IF;
END $$;