/*
  # Create base tables for Property Management System

  ## Overview
  Creates the foundational tables: users and agencies

  ## New Tables
  
  ### `users`
  - `id` (bigserial, primary key) - Auto-incrementing ID
  - `email` (text, unique, not null) - User email
  - `password` (text, not null) - Hashed password
  - `username` (text, unique) - Username
  - `stefanmars_api_token` (text) - API token for stefanmars
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Update timestamp

  ### `agencies`
  - `id` (bigserial, primary key) - Auto-incrementing ID
  - `name` (text, not null) - Agency name
  - `unique_key` (text, unique, not null) - Unique identifier
  - `office_name` (text) - Office name
  - `address` (text) - Office address
  - `address1` (text) - Address line 1
  - `address2` (text) - Address line 2
  - `logo` (text) - Logo URL
  - `site` (text) - Site URL
  - `site_name` (text) - Acquaint site name
  - `acquaint_site_prefix` (text) - Acquaint site prefix
  - `daft_api_key` (text) - Daft API key
  - `myhome_api_key` (text) - MyHome API key
  - `myhome_group_id` (integer) - MyHome group ID
  - `fourpm_branch_id` (integer) - 4PM branch ID
  - `ghl_id` (text) - GoHighLevel ID
  - `whmcs_id` (text) - WHMCS ID
  - `primary_source` (text) - Primary data source
  - `total_properties` (integer) - Total properties count
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Update timestamp

  ## Security
  - Enable RLS on both tables
  - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  username text UNIQUE,
  stefanmars_api_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own user data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Authenticated users can update own user data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  unique_key text UNIQUE NOT NULL,
  office_name text,
  address text,
  address1 text,
  address2 text,
  logo text,
  site text,
  site_name text,
  acquaint_site_prefix text,
  daft_api_key text,
  myhome_api_key text,
  myhome_group_id integer,
  fourpm_branch_id integer,
  ghl_id text,
  whmcs_id text,
  primary_source text,
  total_properties integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all agencies"
  ON agencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert agencies"
  ON agencies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update agencies"
  ON agencies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete agencies"
  ON agencies FOR DELETE
  TO authenticated
  USING (true);