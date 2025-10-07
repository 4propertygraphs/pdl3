import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey, x-api-token",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const apiToken = req.headers.get("x-api-token");
    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: "Missing x-api-token header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const url = new URL(req.url);
    const sync = url.searchParams.get("sync");

    if (sync === 'true') {
      const response = await fetch("https://api.stefanmars.nl/api/agencies", {
        method: "GET",
        headers: {
          "token": apiToken,
        },
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch from 4PM API" }),
          {
            status: response.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const apiAgencies = await response.json();

      for (const agency of apiAgencies) {
        const agencyData = {
          unique_key: agency.unique_key,
          name: agency.name || '',
          address: agency.address || '',
          city: agency.city || '',
          county: agency.county || '',
          phone: agency.phone || '',
          email: agency.email || '',
          website: agency.website || '',
          logo_url: agency.logo_url || '',
          description: agency.description || '',
          primary_source: agency.primary_source || '',
          myhome_key: agency.myhome_key || '',
          acquaint_key: agency.acquaint_key || '',
          daft_key: agency.daft_key || '',
        };

        const { error: upsertError } = await supabaseClient
          .from('agencies')
          .upsert(agencyData, {
            onConflict: 'unique_key',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error('Error upserting agency:', upsertError);
        }
      }
    }

    const { data: agencies, error: agenciesError } = await supabaseClient
      .from('agencies')
      .select('*')
      .order('name');

    if (agenciesError) {
      return new Response(
        JSON.stringify({ error: agenciesError.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(JSON.stringify(agencies || []), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});