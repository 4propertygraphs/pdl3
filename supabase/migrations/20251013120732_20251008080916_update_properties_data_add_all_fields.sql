/*
  # Update properties_data table to include all API fields

  ## Overview
  Adds comprehensive columns to store all property data from the API response.

  ## Changes - Added Columns to `properties_data`
  Includes BER info, agent details, office info, GPS coordinates, property metadata, location info, pricing details, and more.
*/

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'primary_image') THEN
    ALTER TABLE properties_data ADD COLUMN primary_image text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'short_description') THEN
    ALTER TABLE properties_data ADD COLUMN short_description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'description') THEN
    ALTER TABLE properties_data ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'ber') THEN
    ALTER TABLE properties_data ADD COLUMN ber text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'ber_no') THEN
    ALTER TABLE properties_data ADD COLUMN ber_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'epi') THEN
    ALTER TABLE properties_data ADD COLUMN epi text;
  END IF;
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'accommodation') THEN
    ALTER TABLE properties_data ADD COLUMN accommodation text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'directions') THEN
    ALTER TABLE properties_data ADD COLUMN directions text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'solicitor') THEN
    ALTER TABLE properties_data ADD COLUMN solicitor text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'gps_latitude') THEN
    ALTER TABLE properties_data ADD COLUMN gps_latitude numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'gps_longitude') THEN
    ALTER TABLE properties_data ADD COLUMN gps_longitude numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'gps_zoom') THEN
    ALTER TABLE properties_data ADD COLUMN gps_zoom integer;
  END IF;
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'living_type') THEN
    ALTER TABLE properties_data ADD COLUMN living_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'pics_count') THEN
    ALTER TABLE properties_data ADD COLUMN pics_count integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'list_reff') THEN
    ALTER TABLE properties_data ADD COLUMN list_reff text;
  END IF;
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'completed_date') THEN
    ALTER TABLE properties_data ADD COLUMN completed_date text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'auction_date') THEN
    ALTER TABLE properties_data ADD COLUMN auction_date text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties_data' AND column_name = 'auction_address') THEN
    ALTER TABLE properties_data ADD COLUMN auction_address text;
  END IF;
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