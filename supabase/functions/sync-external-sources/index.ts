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

  let synced = 0;
  let errors = 0;

  try {
    const { data: properties } = await supabaseClient
      .from('properties')
      .select('external_id')
      .eq('agency_id', agency.id);

    if (!properties || properties.length === 0) return { synced, errors, skipped: 'No properties' };

    for (const prop of properties) {
      try {
        const response = await fetch(`https://api.stefanmars.nl/api/daft?key=${agency.daft_api_key}&id=${prop.external_id}`, {
          headers: { token: apiToken },
        });

        if (response.ok) {
          const text = await response.text();
          if (text && text.trim() !== "") {
            const data = JSON.parse(text);
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
          }
        }
      } catch (e) {
        errors++;
      }
    }
  } catch (e) {
    return { synced, errors, error: e.message };
  }

  return { synced, errors };
}

async function syncMyHomeProperties(supabaseClient: any, agency: any, apiToken: string) {
  if (!agency.myhome_api_key) return { synced: 0, errors: 0, skipped: 'No MyHome API key' };

  let synced = 0;
  let errors = 0;

  try {
    const { data: properties } = await supabaseClient
      .from('properties')
      .select('external_id')
      .eq('agency_id', agency.id);

    if (!properties || properties.length === 0) return { synced, errors, skipped: 'No properties' };

    for (const prop of properties) {
      try {
        const response = await fetch(`https://api.stefanmars.nl/api/myhome?key=${agency.myhome_api_key}&id=${prop.external_id}`, {
          headers: { token: apiToken },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && Object.keys(data).length > 0) {
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
          }
        }
      } catch (e) {
        errors++;
      }
    }
  } catch (e) {
    return { synced, errors, error: e.message };
  }

  return { synced, errors };
}

async function syncWordPressProperties(supabaseClient: any, agency: any, apiToken: string) {
  if (!agency.unique_key) return { synced: 0, errors: 0, skipped: 'No unique key' };

  let synced = 0;
  let errors = 0;

  try {
    const response = await fetch(`https://api.stefanmars.nl/api/properties`, {
      headers: { token: apiToken, key: agency.unique_key },
    });

    if (response.ok) {
      const apiProperties = await response.json();
      if (!Array.isArray(apiProperties)) return { synced, errors, skipped: 'Invalid response' };

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
    return { synced, errors, error: e.message };
  }

  return { synced, errors };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiToken = req.headers.get("token") || Deno.env.get('STEFANMARS_API_TOKEN');
    if (!apiToken) {
      return new Response(JSON.stringify({ error: "Missing API token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: agencies, error: agenciesError } = await supabaseClient
      .from('agencies')
      .select('*');

    if (agenciesError || !agencies) {
      return new Response(JSON.stringify({ error: "Failed to fetch agencies" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const agency of agencies) {
      const agencyResult: any = {
        agency_id: agency.id,
        agency_name: agency.name,
        sources: {},
      };

      const daftResult = await syncDaftProperties(supabaseClient, agency, apiToken);
      agencyResult.sources.daft = daftResult;

      const myhomeResult = await syncMyHomeProperties(supabaseClient, agency, apiToken);
      agencyResult.sources.myhome = myhomeResult;

      const wordpressResult = await syncWordPressProperties(supabaseClient, agency, apiToken);
      agencyResult.sources.wordpress = wordpressResult;

      results.push(agencyResult);
    }

    return new Response(JSON.stringify({
      success: true,
      synced_at: new Date().toISOString(),
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
