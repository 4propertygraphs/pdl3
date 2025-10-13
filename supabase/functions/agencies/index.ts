import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, token",
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

    const url = new URL(req.url);
    const sync = url.searchParams.get("sync");
    const apiToken = req.headers.get("token") || req.headers.get("x-api-token");

    if (sync === 'true' && !apiToken) {
      return new Response(
        JSON.stringify({ error: "Missing token header for sync operation" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (sync === 'true') {
      console.log('[AGENCIES] Starting sync with stefanmars API...');
      const response = await fetch("https://api.stefanmars.nl/api/agencies", {
        method: "GET",
        headers: {
          "token": apiToken,
        },
      });

      if (!response.ok) {
        console.error('[AGENCIES] Stefanmars API returned error:', response.status);
        return new Response(
          JSON.stringify({ error: "Failed to fetch from stefanmars API" }),
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
      console.log('[AGENCIES] Received', apiAgencies.length, 'agencies from API');

      const existingKeys = new Map<string, number>();
      const { data: currentAgencies } = await supabaseClient
        .from('agencies')
        .select('unique_key, id');

      if (currentAgencies) {
        currentAgencies.forEach((a: any) => {
          existingKeys.set(a.unique_key, a.id);
        });
      }
      console.log('[AGENCIES] Found', existingKeys.size, 'existing agencies in database');

      let inserted = 0;
      let updated = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      for (const apiAgency of apiAgencies) {
        try {
          if (!apiAgency.unique_key || !apiAgency.name) {
            errors++;
            errorDetails.push(`Missing required fields for agency: ${JSON.stringify(apiAgency)}`);
            continue;
          }

          const agency = {
            unique_key: apiAgency.unique_key,
            name: apiAgency.name,
            office_name: apiAgency.office_name || null,
            address1: apiAgency.address1 || null,
            address2: apiAgency.address2 || null,
            logo: apiAgency.logo || null,
            site_name: apiAgency.site_name || null,
            site_prefix: apiAgency.site_prefix || null,
            myhome_group_id: apiAgency.myhome_group_id || null,
            fourpm_branch_id: apiAgency.fourpm_branch_id || null,
            ghl_id: apiAgency.ghl_id || null,
            whmcs_id: apiAgency.whmcs_id || null,
            site: apiAgency.site || null,
            acquaint_site_prefix: apiAgency.acquaint_site_prefix || null,
            daft_api_key: apiAgency.daft_api_key || null,
            myhome_api_key: apiAgency.myhome_api_key || null,
            primary_source: apiAgency.primary_source || null,
          };

          if (existingKeys.has(apiAgency.unique_key)) {
            const { error: updateError } = await supabaseClient
              .from('agencies')
              .update(agency)
              .eq('unique_key', apiAgency.unique_key);

            if (updateError) {
              errors++;
              errorDetails.push(`Update error for ${apiAgency.name}: ${updateError.message}`);
              console.error('[AGENCIES] Update error:', updateError);
            } else {
              updated++;
            }
          } else {
            const { error: insertError } = await supabaseClient
              .from('agencies')
              .insert(agency);

            if (insertError) {
              errors++;
              errorDetails.push(`Insert error for ${apiAgency.name}: ${insertError.message}`);
              console.error('[AGENCIES] Insert error:', insertError);
            } else {
              inserted++;
              existingKeys.set(agency.unique_key, 0);
            }
          }
        } catch (agencyError) {
          errors++;
          errorDetails.push(`Exception for agency: ${agencyError.message}`);
          console.error('[AGENCIES] Exception:', agencyError);
        }
      }

      console.log('[AGENCIES] Sync complete. Inserted:', inserted, 'Updated:', updated, 'Errors:', errors);
      if (errorDetails.length > 0 && errorDetails.length <= 10) {
        console.error('[AGENCIES] Error details:', errorDetails);
      }

      const { data: syncedAgencies, error: finalError } = await supabaseClient
        .from('agencies')
        .select('*')
        .order('name');

      if (finalError) {
        throw finalError;
      }

      return new Response(
        JSON.stringify({
          agencies: syncedAgencies,
          sync_stats: {
            inserted,
            updated,
            errors,
            total: syncedAgencies?.length || 0,
            error_sample: errorDetails.slice(0, 5)
          }
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: agencies, error } = await supabaseClient
      .from('agencies')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify(agencies),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('[AGENCIES] Fatal error:', error);
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