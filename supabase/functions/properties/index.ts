import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, token",
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

    const apiToken = req.headers.get("token") || req.headers.get("x-api-token");
    if (!apiToken) {
      return new Response(JSON.stringify({ error: "Missing token header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const sync = url.searchParams.get("sync");

    if (!key) {
      return new Response(JSON.stringify({ error: "Missing key parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('*')
      .eq('unique_key', key)
      .maybeSingle();

    if (agencyError || !agency) {
      const agenciesResponse = await fetch("https://api.stefanmars.nl/api/agencies", {
        method: "GET",
        headers: { "token": apiToken },
      });

      if (!agenciesResponse.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch agencies from API" }), {
          status: agenciesResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const apiAgencies = await agenciesResponse.json();
      const matchingAgency = apiAgencies.find((a: any) => a.unique_key === key);

      if (!matchingAgency) {
        return new Response(JSON.stringify({ error: "Agency not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const agencyData = {
        unique_key: matchingAgency.unique_key,
        name: matchingAgency.name || '',
        primary_source: matchingAgency.primary_source || '',
      };

      const { data: insertedAgency, error: insertError } = await supabaseClient
        .from('agencies')
        .upsert(agencyData, { onConflict: 'unique_key' })
        .select()
        .single();

      if (insertError || !insertedAgency) {
        return new Response(JSON.stringify({ error: "Failed to insert agency" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      agency = insertedAgency;
    }

    if (sync === 'true') {
      const response = await fetch("https://api.stefanmars.nl/api/properties", {
        method: "GET",
        headers: { "token": apiToken, "key": key },
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch properties" }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const apiProperties = await response.json();
      for (const prop of apiProperties) {
        await supabaseClient.from('properties').upsert({
          agency_id: agency.id,
          source: prop.Source || 'unknown',
          external_id: prop.ListReff || prop.Id?.toString(),
          house_location: prop.Address || '',
          house_price: prop.Price || '',
          house_bedrooms: parseInt(prop.Beds) || null,
          house_bathrooms: parseInt(prop.BathRooms) || null,
          agency_name: agency.name,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'agency_id,external_id' });
      }
    }

    const { data: properties, error: propertiesError } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('agency_id', agency.id)
      .order('updated_at', { ascending: false });

    if (propertiesError) {
      return new Response(JSON.stringify({ error: propertiesError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(properties || []), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});