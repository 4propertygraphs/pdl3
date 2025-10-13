import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey, x-api-token, token",
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

    console.log('[AGENCIES] ======================')
    console.log('[AGENCIES] All request headers:');
    req.headers.forEach((value, key) => {
      console.log(`[AGENCIES]   ${key}: ${value}`);
    });
    console.log('[AGENCIES] ======================');

    const url = new URL(req.url);
    const sync = url.searchParams.get("sync");

    const apiToken = req.headers.get("token") || req.headers.get("x-api-token");
    console.log('[AGENCIES] API Token present:', !!apiToken);
    console.log('[AGENCIES] API Token value:', apiToken);
    console.log('[AGENCIES] Token from "token" header:', req.headers.get("token"));
    console.log('[AGENCIES] Token from "x-api-token" header:', req.headers.get("x-api-token"));
    console.log('[AGENCIES] Sync requested:', sync);

    if (sync === 'true' && !apiToken) {
      console.error('[AGENCIES] Missing token header for sync operation');
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
    console.log('[AGENCIES] Sync parameter:', sync);

    if (sync === 'true') {
      console.log('[AGENCIES] Starting sync from stefanmars API...');
      const response = await fetch("https://api.stefanmars.nl/api/agencies", {
        method: "GET",
        headers: {
          "token": apiToken,
        },
      });

      if (!response.ok) {
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
      console.log(`[AGENCIES] Fetched ${apiAgencies.length} agencies from API`);

      const syncedAgencies = [];
      let inserted = 0;
      let updated = 0;
      let errors = 0;

      const existingKeys = new Map<string, number>();
      const { data: currentAgencies } = await supabaseClient
        .from('agencies')
        .select('unique_key, id');

      if (currentAgencies) {
        currentAgencies.forEach((a: any) => {
          existingKeys.set(a.unique_key, a.id);
        });
      }

      for (const apiAgency of apiAgencies) {
        try {
          const agency = {
            unique_key: apiAgency.unique_key,
            name: apiAgency.name || '',
            office_name: apiAgency.office_name || '',
            address1: apiAgency.address1 || '',
            address2: apiAgency.address2 || '',
            logo: apiAgency.logo || '',
            site_name: apiAgency.site_name || '',
            site_prefix: apiAgency.site_prefix || '',
            myhome_group_id: apiAgency.myhome_group_id || null,
            fourpm_branch_id: apiAgency.fourpm_branch_id || null,
            ghl_id: apiAgency.ghl_id || '',
            whmcs_id: apiAgency.whmcs_id || '',
            site: apiAgency.site || '',
            acquaint_site_prefix: apiAgency.acquaint_site_prefix || '',
            daft_api_key: apiAgency.daft_api_key || '',
            myhome_api_key: apiAgency.myhome_api_key || '',
            primary_source: apiAgency.primary_source || '',
          };

          if (existingKeys.has(apiAgency.unique_key)) {
            const { error: updateError } = await supabaseClient
              .from('agencies')
              .update(agency)
              .eq('unique_key', apiAgency.unique_key);

            if (updateError) {
              console.error(`[AGENCIES] Error updating agency ${agency.unique_key}:`, updateError);
              errors++;
            } else {
              updated++;
            }
          } else {
            const { error: insertError } = await supabaseClient
              .from('agencies')
              .insert(agency);

            if (insertError) {
              console.error(`[AGENCIES] Error inserting agency ${agency.unique_key}:`, insertError);
              errors++;
            } else {
              inserted++;
              existingKeys.set(agency.unique_key, 0);
            }
          }
        } catch (agencyError) {
          console.error('[AGENCIES] Error processing agency:', agencyError);
          errors++;
        }
      }

      console.log(`[AGENCIES] Sync complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);

      const { data: syncedAgencies, error: finalError } = await supabaseClient
        .from('agencies')
        .select('*')
        .order('name');

      if (finalError) {
        console.error('[AGENCIES] Error fetching synced agencies:', finalError);
        throw finalError;
      }

      return new Response(
        JSON.stringify({ 
          agencies: syncedAgencies,
          sync_stats: {
            inserted,
            updated,
            errors,
            total: syncedAgencies?.length || 0
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

    console.log('[AGENCIES] Fetching agencies from database...');
    const { data: agencies, error } = await supabaseClient
      .from('agencies')
      .select('*')
      .order('name');

    if (error) {
      console.error('[AGENCIES] Error fetching agencies:', error);
      throw error;
    }

    console.log('[AGENCIES] Returning agencies count:', agencies?.length || 0);

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
    console.error('[AGENCIES] Unexpected error:', error);
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