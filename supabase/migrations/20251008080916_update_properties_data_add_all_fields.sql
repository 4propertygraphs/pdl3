/*
  # Update properties_data table to include all API fields

  ## Overview
  Adds comprehensive columns to store all property data from the API response.

  ## Changes
  
  ### Added Columns to `properties_data`
  - `primary_image` (text) - Main property image URL
  - `short_description` (text) - Brief property description
  - `description` (text) - Full property description
  - `ber` (text) - Building Energy Rating
  - `ber_no` (text) - BER Certificate Number
  - `epi` (text) - Energy Performance Indicator
  - `agent_id` (integer) - Agent ID from API
  - `agent_photo` (text) - Agent photo URL
  - `agent_qualification` (text) - Agent qualifications
  - `agent_phone` (text) - Agent phone number
  - `agent_email` (text) - Agent email
  - `logo` (text) - Office logo URL
  - `office_id` (integer) - Office ID from API
  - `office_name` (text) - Office name
  - `office_address` (text) - Office address
  - `office_phone` (text) - Office phone
  - `office_mobile` (text) - Office mobile
  - `office_psra_no` (text) - PSRA Registration Number
  - `accommodation` (text) - Property accommodation details
  - `directions` (text) - Directions to property
  - `solicitor` (text) - Solicitor information
  - `gps_latitude` (numeric) - GPS Latitude
  - `gps_longitude` (numeric) - GPS Longitude
  - `gps_zoom` (integer) - GPS Zoom level
  - `tags` (jsonb) - Property tags array
  - `views` (jsonb) - Property views data
  - `pdfs` (jsonb) - PDF documents array
  - `tours` (jsonb) - Virtual tours array
  - `floors` (jsonb) - Floor plans array
  - `living_type` (text) - Type of living
  - `pics_count` (integer) - Number of pictures
  - `list_reff` (text) - Listing reference
  - `country_name` (text) - Country name
  - `district_name` (text) - District name
  - `county_city_name` (text) - County/City name
  - `eircode` (text) - Irish postal code
  - `postcode` (text) - Postal code
  - `bathrooms` (integer) - Number of bathrooms
  - `is_featured` (boolean) - Is featured property
  - `price_in_decimal` (numeric) - Price as decimal
  - `control_rule` (text) - Control rule status
  - `selling_type` (text) - Selling type
  - `property_market` (text) - Property market category
  - `has_related_properties` (boolean) - Has related properties
  - `related_properties` (text) - Related properties info
  - `parent_id` (text) - Parent property ID
  - `viewing_details` (text) - Viewing details
  - `amenities` (text) - Property amenities
  - `prop_categories` (jsonb) - Property categories array
  - `completed_date` (text) - Completion date
  - `auction_date` (text) - Auction date
  - `auction_address` (text) - Auction address
  - `agency_domain` (text) - Agency domain
  - `acquaint_site_prefix` (text) - Acquaint site prefix
  - `acquaint_site_id` (text) - Acquaint site ID
  - `feed_to` (text) - Feed destinations
  - `disclaimer` (text) - Property disclaimer
  - `min_price` (numeric) - Minimum price
  - `max_price` (numeric) - Maximum price
  - `hide_price` (boolean) - Hide price flag
  - `price_term` (text) - Price term (e.g., per month)

  ## Notes
  - All new columns allow NULL values for flexibility
  - JSONB used for array/object fields for efficient querying
  - Numeric type used for prices and coordinates
*/

-- Add all new columns to properties_data table
DO $$ 
BEGIN
  -- Primary image and descriptions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'primary_image') THEN
    ALTER TABLE properties_data ADD COLUMN primary_image text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'short_description') THEN
    ALTER TABLE properties_data ADD COLUMN short_description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'description') THEN
    ALTER TABLE properties_data ADD COLUMN description text;
  END IF;

  -- BER information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'ber_no') THEN
    ALTER TABLE properties_data ADD COLUMN ber_no text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'epi') THEN
    ALTER TABLE properties_data ADD COLUMN epi text;
  END IF;

  -- Agent information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'agent_id') THEN
    ALTER TABLE properties_data ADD COLUMN agent_id integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'agent_photo') THEN
    ALTER TABLE properties_data ADD COLUMN agent_photo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'agent_qualification') THEN
    ALTER TABLE properties_data ADD COLUMN agent_qualification text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'agent_phone') THEN
    ALTER TABLE properties_data ADD COLUMN agent_phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'agent_email') THEN
    ALTER TABLE properties_data ADD COLUMN agent_email text;
  END IF;

  -- Office information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'logo') THEN
    ALTER TABLE properties_data ADD COLUMN logo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'office_id') THEN
    ALTER TABLE properties_data ADD COLUMN office_id integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'office_name') THEN
    ALTER TABLE properties_data ADD COLUMN office_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'office_address') THEN
    ALTER TABLE properties_data ADD COLUMN office_address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'office_phone') THEN
    ALTER TABLE properties_data ADD COLUMN office_phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'office_mobile') THEN
    ALTER TABLE properties_data ADD COLUMN office_mobile text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'office_psra_no') THEN
    ALTER TABLE properties_data ADD COLUMN office_psra_no text;
  END IF;

  -- Property details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'accommodation') THEN
    ALTER TABLE properties_data ADD COLUMN accommodation text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'directions') THEN
    ALTER TABLE properties_data ADD COLUMN directions text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'solicitor') THEN
    ALTER TABLE properties_data ADD COLUMN solicitor text;
  END IF;

  -- GPS coordinates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'gps_latitude') THEN
    ALTER TABLE properties_data ADD COLUMN gps_latitude numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'gps_longitude') THEN
    ALTER TABLE properties_data ADD COLUMN gps_longitude numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'gps_zoom') THEN
    ALTER TABLE properties_data ADD COLUMN gps_zoom integer;
  END IF;

  -- Arrays and complex data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'tags') THEN
    ALTER TABLE properties_data ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'views') THEN
    ALTER TABLE properties_data ADD COLUMN views jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'pdfs') THEN
    ALTER TABLE properties_data ADD COLUMN pdfs jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'tours') THEN
    ALTER TABLE properties_data ADD COLUMN tours jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'floors') THEN
    ALTER TABLE properties_data ADD COLUMN floors jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Additional metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'living_type') THEN
    ALTER TABLE properties_data ADD COLUMN living_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'pics_count') THEN
    ALTER TABLE properties_data ADD COLUMN pics_count integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'list_reff') THEN
    ALTER TABLE properties_data ADD COLUMN list_reff text;
  END IF;

  -- Location information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'country_name') THEN
    ALTER TABLE properties_data ADD COLUMN country_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'district_name') THEN
    ALTER TABLE properties_data ADD COLUMN district_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'county_city_name') THEN
    ALTER TABLE properties_data ADD COLUMN county_city_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'eircode') THEN
    ALTER TABLE properties_data ADD COLUMN eircode text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'postcode') THEN
    ALTER TABLE properties_data ADD COLUMN postcode text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'bathrooms') THEN
    ALTER TABLE properties_data ADD COLUMN bathrooms integer;
  END IF;

  -- Property flags and metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'is_featured') THEN
    ALTER TABLE properties_data ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'price_in_decimal') THEN
    ALTER TABLE properties_data ADD COLUMN price_in_decimal numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'control_rule') THEN
    ALTER TABLE properties_data ADD COLUMN control_rule text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'selling_type') THEN
    ALTER TABLE properties_data ADD COLUMN selling_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'property_market') THEN
    ALTER TABLE properties_data ADD COLUMN property_market text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'has_related_properties') THEN
    ALTER TABLE properties_data ADD COLUMN has_related_properties boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'related_properties') THEN
    ALTER TABLE properties_data ADD COLUMN related_properties text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'parent_id') THEN
    ALTER TABLE properties_data ADD COLUMN parent_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'viewing_details') THEN
    ALTER TABLE properties_data ADD COLUMN viewing_details text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'amenities') THEN
    ALTER TABLE properties_data ADD COLUMN amenities text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'prop_categories') THEN
    ALTER TABLE properties_data ADD COLUMN prop_categories jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Dates and auction info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'completed_date') THEN
    ALTER TABLE properties_data ADD COLUMN completed_date text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'auction_date') THEN
    ALTER TABLE properties_data ADD COLUMN auction_date text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'auction_address') THEN
    ALTER TABLE properties_data ADD COLUMN auction_address text;
  END IF;

  -- Agency and feed information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'agency_domain') THEN
    ALTER TABLE properties_data ADD COLUMN agency_domain text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'acquaint_site_prefix') THEN
    ALTER TABLE properties_data ADD COLUMN acquaint_site_prefix text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'acquaint_site_id') THEN
    ALTER TABLE properties_data ADD COLUMN acquaint_site_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'feed_to') THEN
    ALTER TABLE properties_data ADD COLUMN feed_to text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'disclaimer') THEN
    ALTER TABLE properties_data ADD COLUMN disclaimer text;
  END IF;

  -- Price details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'min_price') THEN
    ALTER TABLE properties_data ADD COLUMN min_price numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'max_price') THEN
    ALTER TABLE properties_data ADD COLUMN max_price numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'hide_price') THEN
    ALTER TABLE properties_data ADD COLUMN hide_price boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'price_term') THEN
    ALTER TABLE properties_data ADD COLUMN price_term text;
  END IF;
END $$;