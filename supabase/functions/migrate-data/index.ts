import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const sql = postgres({
      host: "db.oikseiowedzgosakmkkf.supabase.co",
      port: 5432,
      database: "postgres",
      username: "postgres",
      password: "Pokemon123@Aa",
    });

    const newSupabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const newSupabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const newDb = createClient(newSupabaseUrl, newSupabaseKey);

    const stats = {
      agencies: 0,
      properties: 0,
      properties_data: 0,
      field_mappings: 0,
      errors: [] as string[],
    };

    const agencies = await sql`SELECT * FROM agencies`;
    console.log(`Found ${agencies.length} agencies to migrate`);

    for (const agency of agencies) {
      try {
        const { error } = await newDb.from("agencies").insert({
          id: agency.id,
          name: agency.name,
          unique_key: agency.unique_key,
          website: agency.website,
          logo: agency.logo,
          description: agency.description,
          contact_email: agency.contact_email,
          contact_phone: agency.contact_phone,
          address: agency.address,
          created_at: agency.created_at,
          updated_at: agency.updated_at,
        });

        if (error) {
          console.error(`Error inserting agency ${agency.id}:`, error);
          stats.errors.push(`Agency ${agency.name}: ${error.message}`);
        } else {
          stats.agencies++;
        }
      } catch (e) {
        console.error(`Exception inserting agency ${agency.id}:`, e);
        stats.errors.push(`Agency ${agency.name}: ${e.message}`);
      }
    }

    const properties = await sql`SELECT * FROM properties`;
    console.log(`Found ${properties.length} properties to migrate`);

    for (const property of properties) {
      try {
        const { error } = await newDb.from("properties").insert({
          id: property.id,
          agency_id: property.agency_id,
          external_id: property.external_id,
          title: property.title,
          description: property.description,
          price: property.price,
          property_type: property.property_type,
          status: property.status,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          address: property.address,
          city: property.city,
          county: property.county,
          eircode: property.eircode,
          latitude: property.latitude,
          longitude: property.longitude,
          images: property.images,
          features: property.features,
          source_url: property.source_url,
          last_synced: property.last_synced,
          created_at: property.created_at,
          updated_at: property.updated_at,
        });

        if (error) {
          console.error(`Error inserting property ${property.id}:`, error);
          stats.errors.push(`Property ${property.external_id}: ${error.message}`);
        } else {
          stats.properties++;
        }
      } catch (e) {
        console.error(`Exception inserting property ${property.id}:`, e);
        stats.errors.push(`Property ${property.external_id}: ${e.message}`);
      }
    }

    const propertiesData = await sql`SELECT * FROM properties_data`;
    console.log(`Found ${propertiesData.length} properties_data to migrate`);

    for (const propData of propertiesData) {
      try {
        const { error } = await newDb.from("properties_data").insert({
          id: propData.id,
          agency_id: propData.agency_id,
          property_id: propData.property_id,
          raw_data: propData.raw_data,
          created_at: propData.created_at,
          updated_at: propData.updated_at,
        });

        if (error) {
          console.error(`Error inserting properties_data ${propData.id}:`, error);
          stats.errors.push(`Properties_data ${propData.id}: ${error.message}`);
        } else {
          stats.properties_data++;
        }
      } catch (e) {
        console.error(`Exception inserting properties_data ${propData.id}:`, e);
        stats.errors.push(`Properties_data ${propData.id}: ${e.message}`);
      }
    }

    const fieldMappings = await sql`SELECT * FROM field_mappings`;
    console.log(`Found ${fieldMappings.length} field_mappings to migrate`);

    for (const mapping of fieldMappings) {
      try {
        const { error } = await newDb.from("field_mappings").insert({
          id: mapping.id,
          agency_id: mapping.agency_id,
          source_field: mapping.source_field,
          target_field: mapping.target_field,
          transformation: mapping.transformation,
          is_active: mapping.is_active,
          wordpress_field: mapping.wordpress_field,
          field_order: mapping.field_order,
          created_at: mapping.created_at,
          updated_at: mapping.updated_at,
        });

        if (error) {
          console.error(`Error inserting field_mapping ${mapping.id}:`, error);
          stats.errors.push(`Field_mapping ${mapping.id}: ${error.message}`);
        } else {
          stats.field_mappings++;
        }
      } catch (e) {
        console.error(`Exception inserting field_mapping ${mapping.id}:`, e);
        stats.errors.push(`Field_mapping ${mapping.id}: ${e.message}`);
      }
    }

    await sql.end();

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: `Migration completed: ${stats.agencies} agencies, ${stats.properties} properties, ${stats.properties_data} properties_data, ${stats.field_mappings} field_mappings`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});