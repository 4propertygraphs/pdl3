import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, token",
};

function extractDate(data: any, field: string): string | null {
  if (!data || !field) return null;
  const value = data[field];
  if (!value) return null;
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

async function syncDaftProperties(supabaseClient: any, agency: any, apiToken: string) {
  if (!agency.daft_api_key) return { synced: 0, errors: 0, skipped: 'No Daft API key' };

  console.log(`   📍 [DAFT] Starting sync for agency ${agency.name}...`);
  let synced = 0;
  let errors = 0;

  try {
    const { data: properties } = await supabaseClient
      .from('properties')
      .select('external_id')
      .eq('agency_id', agency.id);

    if (!properties || properties.length === 0) {
      console.log(`   ⚠️  [DAFT] No properties found`);
      return { synced, errors, skipped: 'No properties' };
    }

    console.log(`   📊 [DAFT] Found ${properties.length} properties to sync`);

    for (const prop of properties) {
      try {
        const response = await fetch(`https://api.stefanmars.nl/api/daft?key=${agency.daft_api_key}&id=${prop.external_id}`, {
          headers: { token: apiToken },
        });

        if (response.ok) {
          const text = await response.text();
          if (!text || text.trim() === "" || text === '""' || text === "null") {
            console.log(`   ⚠️  [DAFT] Empty response for ${prop.external_id}`);
            errors++;
            continue;
          }

          let data;
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error(`   ❌ [DAFT] JSON parse error for ${prop.external_id}:`, text.substring(0, 100));
            errors++;
            continue;
          }

          if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            console.log(`   ⚠️  [DAFT] Empty object for ${prop.external_id}`);
            errors++;
            continue;
          }

          const apiCreated = extractDate(data, 'startDate');

          await supabaseClient.from('daft_properties').upsert({
            agency_id: agency.id,
            external_id: prop.external_id,
            raw_data: data,
            api_created_at: apiCreated,
            api_modified_at: null,
            last_fetched: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agency_id,external_id' });

          synced++;
        } else {
          console.log(`   ⚠️  [DAFT] HTTP ${response.status} for ${prop.external_id}`);
          errors++;
        }
      } catch (e) {
        console.error(`   ❌ [DAFT] Exception for ${prop.external_id}:`, e.message);
        errors++;
      }
    }
  } catch (e) {
    console.error(`   ❌ [DAFT] Error:`, e);
    return { synced, errors, error: e.message };
  }

  console.log(`   ✅ [DAFT] Synced ${synced} properties, ${errors} errors`);
  return { synced, errors };
}

async function syncMyHomeProperties(supabaseClient: any, agency: any, apiToken: string) {
  if (!agency.myhome_api_key) return { synced: 0, errors: 0, skipped: 'No MyHome API key' };

  console.log(`   📍 [MYHOME] Starting sync for agency ${agency.name}...`);
  let synced = 0;
  let errors = 0;

  try {
    const { data: properties } = await supabaseClient
      .from('properties')
      .select('external_id')
      .eq('agency_id', agency.id);

    if (!properties || properties.length === 0) {
      console.log(`   ⚠️  [MYHOME] No properties found`);
      return { synced, errors, skipped: 'No properties' };
    }

    console.log(`   📊 [MYHOME] Found ${properties.length} properties to sync`);

    for (const prop of properties) {
      try {
        const response = await fetch(`https://api.stefanmars.nl/api/myhome?key=${agency.myhome_api_key}&id=${prop.external_id}`, {
          headers: { token: apiToken },
        });

        if (response.ok) {
          let data;
          try {
            data = await response.json();
          } catch (parseError) {
            const text = await response.text();
            console.error(`   ❌ [MYHOME] JSON parse error for ${prop.external_id}:`, text.substring(0, 100));
            errors++;
            continue;
          }

          if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            console.log(`   ⚠️  [MYHOME] Empty object for ${prop.external_id}`);
            errors++;
            continue;
          }

          const apiCreated = extractDate(data, 'CreatedOnDate');
          const apiModified = extractDate(data, 'ModifiedOnDate');

          await supabaseClient.from('myhome_properties').upsert({
            agency_id: agency.id,
            external_id: prop.external_id,
            raw_data: data,
            api_created_at: apiCreated,
            api_modified_at: apiModified,
            last_fetched: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agency_id,external_id' });

          synced++;
        } else {
          console.log(`   ⚠️  [MYHOME] HTTP ${response.status} for ${prop.external_id}`);
          errors++;
        }
      } catch (e) {
        console.error(`   ❌ [MYHOME] Exception for ${prop.external_id}:`, e.message);
        errors++;
      }
    }
  } catch (e) {
    console.error(`   ❌ [MYHOME] Error:`, e);
    return { synced, errors, error: e.message };
  }

  console.log(`   ✅ [MYHOME] Synced ${synced} properties, ${errors} errors`);
  return { synced, errors };
}

async function syncWordPressProperties(supabaseClient: any, agency: any, apiToken: string) {
  if (!agency.unique_key) return { synced: 0, errors: 0, skipped: 'No unique key' };

  console.log(`   📍 [WORDPRESS] Starting sync for agency ${agency.name}...`);
  let synced = 0;
  let errors = 0;

  try {
    const response = await fetch(`https://api.stefanmars.nl/api/properties`, {
      headers: { token: apiToken, key: agency.unique_key },
    });

    if (response.ok) {
      const apiProperties = await response.json();
      if (!Array.isArray(apiProperties)) {
        console.log(`   ⚠️  [WORDPRESS] Invalid response`);
        return { synced, errors, skipped: 'Invalid response' };
      }

      console.log(`   📊 [WORDPRESS] Found ${apiProperties.length} properties to sync`);

      for (const propertyData of apiProperties) {
        try {
          const apiCreated = extractDate(propertyData, 'date') || extractDate(propertyData, 'AddedDate');
          const apiModified = extractDate(propertyData, 'Modified');

          await supabaseClient.from('wordpress_properties').upsert({
            agency_id: agency.id,
            external_id: propertyData.ListReff,
            raw_data: propertyData,
            api_created_at: apiCreated,
            api_modified_at: apiModified,
            last_fetched: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agency_id,external_id' });

          await supabaseClient.from('acquaint_properties').upsert({
            agency_id: agency.id,
            external_id: propertyData.ListReff,
            raw_data: propertyData,
            api_created_at: apiCreated,
            api_modified_at: apiModified,
            last_fetched: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agency_id,external_id' });

          synced++;
        } catch (e) {
          errors++;
        }
      }
    }
  } catch (e) {
    console.error(`   ❌ [WORDPRESS] Error:`, e);
    return { synced, errors, error: e.message };
  }

  console.log(`   ✅ [WORDPRESS] Synced ${synced} properties, ${errors} errors`);
  return { synced, errors };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agencyId = url.searchParams.get("agency_id");

    if (!agencyId) {
      return new Response(JSON.stringify({ error: "Missing agency_id parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🚀 [SYNC-AGENCY] Starting sync for agency_id: ${agencyId}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiToken = req.headers.get("token") || Deno.env.get('STEFANMARS_API_TOKEN');
    if (!apiToken) {
      console.error('❌ [SYNC-AGENCY] Missing API token');
      return new Response(JSON.stringify({ error: "Missing API token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('*')
      .eq('id', agencyId)
      .maybeSingle();

    if (agencyError || !agency) {
      console.error('❌ [SYNC-AGENCY] Agency not found');
      return new Response(JSON.stringify({ error: "Agency not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🏢 [SYNC-AGENCY] Processing agency: ${agency.name}`);

    const result: any = {
      agency_id: agency.id,
      agency_name: agency.name,
      sources: {},
    };

    const daftResult = await syncDaftProperties(supabaseClient, agency, apiToken);
    result.sources.daft = daftResult;

    const myhomeResult = await syncMyHomeProperties(supabaseClient, agency, apiToken);
    result.sources.myhome = myhomeResult;

    const wordpressResult = await syncWordPressProperties(supabaseClient, agency, apiToken);
    result.sources.wordpress = wordpressResult;

    console.log('🎉 [SYNC-AGENCY] Sync completed!');

    return new Response(JSON.stringify({
      success: true,
      synced_at: new Date().toISOString(),
      result,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('❌ [SYNC-AGENCY] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
