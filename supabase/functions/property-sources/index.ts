import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey, token",
};

const CACHE_EXPIRY_HOURS = 24;

function isCacheValid(lastFetched: string | null): boolean {
  if (!lastFetched) return false;
  const cacheTime = new Date(lastFetched).getTime();
  const now = new Date().getTime();
  const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
  return hoursDiff < CACHE_EXPIRY_HOURS;
}

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const listReff = url.searchParams.get("id");
    const daftKey = url.searchParams.get("daft_key");
    const myhomeKey = url.searchParams.get("myhome_key");
    const fourpmKey = url.searchParams.get("fourpm_key");
    const forceRefresh = url.searchParams.get("force_refresh") === "true";

    if (!listReff) {
      return new Response(JSON.stringify({ error: "Missing id parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiToken = req.headers.get("token");
    if (!apiToken) {
      return new Response(JSON.stringify({ error: "Missing token header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: property } = await supabaseClient
      .from('properties')
      .select('agency_id')
      .eq('external_id', listReff)
      .maybeSingle();

    const agencyId = property?.agency_id;

    const results: any = {
      listReff,
      wordpress: null,
      daft: null,
      myhome: null,
      errors: {},
      fromCache: {
        wordpress: false,
        daft: false,
        myhome: false,
      },
    };

    if (fourpmKey && agencyId) {
      try {
        const { data: cachedData } = await supabaseClient
          .from('wordpress_properties')
          .select('raw_data, last_fetched')
          .eq('agency_id', agencyId)
          .eq('external_id', listReff)
          .maybeSingle();

        if (!forceRefresh && cachedData && isCacheValid(cachedData.last_fetched)) {
          results.wordpress = cachedData.raw_data;
          results.fromCache.wordpress = true;
        } else {
          const response = await fetch(`https://api.stefanmars.nl/api/properties`, {
            headers: { token: apiToken, key: fourpmKey },
          });

          if (response.ok) {
            const data = await response.json();
            const propertyData = Array.isArray(data) ? data.find((p: any) => p.ListReff === listReff) : null;

            if (propertyData) {
              const apiCreated = extractDate(propertyData, 'date') || extractDate(propertyData, 'AddedDate');
              const apiModified = extractDate(propertyData, 'Modified');

              await supabaseClient.from('wordpress_properties').upsert({
                agency_id: agencyId,
                external_id: listReff,
                raw_data: propertyData,
                api_created_at: apiCreated,
                api_modified_at: apiModified,
                last_fetched: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'agency_id,external_id' });

              await supabaseClient.from('acquaint_properties').upsert({
                agency_id: agencyId,
                external_id: listReff,
                raw_data: propertyData,
                api_created_at: apiCreated,
                api_modified_at: apiModified,
                last_fetched: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'agency_id,external_id' });

              results.wordpress = propertyData;
            } else {
              results.wordpress = { message: "Property not found in WordPress" };
            }
          } else {
            results.errors.wordpress = `HTTP ${response.status}`;
          }
        }
      } catch (error: any) {
        results.errors.wordpress = error.message;
      }
    }

    if (daftKey && agencyId) {
      try {
        const { data: cachedData } = await supabaseClient
          .from('daft_properties')
          .select('raw_data, last_fetched')
          .eq('agency_id', agencyId)
          .eq('external_id', listReff)
          .maybeSingle();

        if (!forceRefresh && cachedData && isCacheValid(cachedData.last_fetched)) {
          results.daft = cachedData.raw_data;
          results.fromCache.daft = true;
        } else {
          const response = await fetch(`https://api.stefanmars.nl/api/daft?key=${daftKey}&id=${listReff}`, {
            headers: { token: apiToken },
          });

          if (response.ok) {
            const text = await response.text();
            if (text && text.trim() !== "") {
              const daftData = JSON.parse(text);

              const apiCreated = extractDate(daftData, 'startDate');
              const apiModified = null;

              await supabaseClient.from('daft_properties').upsert({
                agency_id: agencyId,
                external_id: listReff,
                raw_data: daftData,
                api_created_at: apiCreated,
                api_modified_at: apiModified,
                last_fetched: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'agency_id,external_id' });

              results.daft = daftData;
            } else {
              results.daft = { message: "Property not found on Daft" };
            }
          } else {
            results.errors.daft = `HTTP ${response.status}`;
          }
        }
      } catch (error: any) {
        results.errors.daft = error.message;
      }
    }

    if (myhomeKey && agencyId) {
      try {
        const { data: cachedData } = await supabaseClient
          .from('myhome_properties')
          .select('raw_data, last_fetched')
          .eq('agency_id', agencyId)
          .eq('external_id', listReff)
          .maybeSingle();

        if (!forceRefresh && cachedData && isCacheValid(cachedData.last_fetched)) {
          results.myhome = cachedData.raw_data;
          results.fromCache.myhome = true;
        } else {
          const response = await fetch(`https://api.stefanmars.nl/api/myhome?key=${myhomeKey}&id=${listReff}`, {
            headers: { token: apiToken },
          });

          if (response.ok) {
            const data = await response.json();
            if (data && Object.keys(data).length > 0) {
              const apiCreated = extractDate(data, 'CreatedOnDate');
              const apiModified = extractDate(data, 'ModifiedOnDate');

              await supabaseClient.from('myhome_properties').upsert({
                agency_id: agencyId,
                external_id: listReff,
                raw_data: data,
                api_created_at: apiCreated,
                api_modified_at: apiModified,
                last_fetched: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'agency_id,external_id' });

              results.myhome = data;
            } else {
              results.myhome = { message: "Property not found on MyHome" };
            }
          } else if (response.status === 404 || response.status === 500) {
            results.myhome = { message: "Property not found on MyHome" };
          } else {
            results.errors.myhome = `HTTP ${response.status}`;
          }
        }
      } catch (error: any) {
        results.errors.myhome = error.message;
      }
    }

    return new Response(JSON.stringify(results), {
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
