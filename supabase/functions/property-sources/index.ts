import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey, token",
};

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
    };

    if (fourpmKey) {
      try {
        const response = await fetch(`https://api.stefanmars.nl/api/properties`, {
          headers: { token: apiToken, key: fourpmKey },
        });

        if (response.ok) {
          const data = await response.json();
          const property = Array.isArray(data) ? data.find((p: any) => p.ListReff === listReff) : null;

          if (property && agencyId) {
            await supabaseClient.from('wordpress_properties').upsert({
              agency_id: agencyId,
              external_id: listReff,
              raw_data: property,
              last_fetched: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'agency_id,external_id' });

            await supabaseClient.from('acquaint_properties').upsert({
              agency_id: agencyId,
              external_id: listReff,
              raw_data: property,
              last_fetched: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'agency_id,external_id' });
          }

          results.wordpress = property || { message: "Property not found in WordPress" };
        } else {
          results.errors.wordpress = `HTTP ${response.status}`;
        }
      } catch (error: any) {
        results.errors.wordpress = error.message;
      }
    }

    if (daftKey) {
      try {
        const response = await fetch(`https://api.stefanmars.nl/api/daft?key=${daftKey}&id=${listReff}`, {
          headers: { token: apiToken },
        });

        if (response.ok) {
          const text = await response.text();
          if (text && text.trim() !== "") {
            const daftData = JSON.parse(text);

            if (agencyId) {
              await supabaseClient.from('daft_properties').upsert({
                agency_id: agencyId,
                external_id: listReff,
                raw_data: daftData,
                last_fetched: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'agency_id,external_id' });
            }

            results.daft = daftData;
          } else {
            results.daft = { message: "Property not found on Daft" };
          }
        } else {
          results.errors.daft = `HTTP ${response.status}`;
        }
      } catch (error: any) {
        results.errors.daft = error.message;
      }
    }

    if (myhomeKey) {
      try {
        const response = await fetch(`https://api.stefanmars.nl/api/myhome?key=${myhomeKey}&id=${listReff}`, {
          headers: { token: apiToken },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && Object.keys(data).length > 0) {
            if (agencyId) {
              await supabaseClient.from('myhome_properties').upsert({
                agency_id: agencyId,
                external_id: listReff,
                raw_data: data,
                last_fetched: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'agency_id,external_id' });
            }

            results.myhome = data;
          } else {
            results.myhome = { message: "Property not found on MyHome" };
          }
        } else if (response.status === 404 || response.status === 500) {
          results.myhome = { message: "Property not found on MyHome" };
        } else {
          results.errors.myhome = `HTTP ${response.status}`;
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
