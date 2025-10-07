import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey, token, x-api-token",
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

    // Log ALL headers
    console.log('[AGENCIES] ======================');
    console.log('[AGENCIES] All request headers:');
    req.headers.forEach((value, key) => {
      console.log(`[AGENCIES]   ${key}: ${value}`);
    });
    console.log('[AGENCIES] ======================');

    const apiToken = req.headers.get("token") || req.headers.get("x-api-token");
    console.log('[AGENCIES] API Token present:', !!apiToken);
    console.log('[AGENCIES] API Token value:', apiToken);
    console.log('[AGENCIES] Token from "token" header:', req.headers.get("token"));
    console.log('[AGENCIES] Token from "x-api-token" header:', req.headers.get("x-api-token"));

    if (!apiToken) {
      console.error('[AGENCIES] Missing token header - NO TOKEN FOUND IN REQUEST');
      return new Response(
        JSON.stringify({ error: "Missing token header" }),
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
    console.log('[AGENCIES] Sync parameter:', sync);

    if (sync === 'true') {
      console.log('[AGENCIES] Starting sync from stefanmars API...');
      const response = await fetch("https://api.stefanmars.nl/api/agencies", {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'token': apiToken,
        },
      });

      if (!response.ok) {
        console.error('[AGENCIES] Stefanmars API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[AGENCIES] Error details:', errorText);
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch from stefanmars API",
            status: response.status,
            details: errorText
          }),
          {
            status: response.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const agencies = await response.json();
      console.log('[AGENCIES] Fetched agencies count:', agencies.length);

      // First, fetch all existing agencies to check for unique_key matches
      const { data: existingAgencies, error: fetchError } = await supabaseClient
        .from('agencies')
        .select('id, unique_key');

      if (fetchError) {
        console.error('[AGENCIES] Error fetching existing agencies:', fetchError);
      }

      const existingKeys = new Map((existingAgencies || []).map(a => [a.unique_key, a.id]));
      console.log('[AGENCIES] Existing unique_keys:', Array.from(existingKeys.keys()));

      // Process agencies one by one to handle duplicates
      let inserted = 0;
      let updated = 0;
      let errors = 0;

      for (const agency of agencies) {
        const existingId = existingKeys.get(agency.unique_key);
        
        if (existingId) {
          // Update existing agency
          const { error: updateError } = await supabaseClient
            .from('agencies')
            .update({
              name: agency.name,
              office_name: agency.office_name,
              address1: agency.address1,
              address2: agency.address2,
              logo: agency.logo,
              site_name: agency.site_name,
              acquaint_site_prefix: agency.acquaint_site_prefix,
              myhome_group_id: agency.myhome_group_id,
              myhome_api_key: agency.myhome_api_key,
              daft_api_key: agency.daft_api_key,
              fourpm_branch_id: agency.fourpm_branch_id,
              ghl_id: agency.ghl_id,
              whmcs_id: agency.whmcs_id,
              total_properties: agency.properties_total || 0,
            })
            .eq('id', existingId);

          if (updateError) {
            console.error(`[AGENCIES] Error updating agency ${agency.unique_key}:`, updateError);
            errors++;
          } else {
            updated++;
          }
        } else {
          // Insert new agency
          const { error: insertError } = await supabaseClient
            .from('agencies')
            .insert({
              name: agency.name,
              unique_key: agency.unique_key,
              office_name: agency.office_name,
              address1: agency.address1,
              address2: agency.address2,
              logo: agency.logo,
              site_name: agency.site_name,
              acquaint_site_prefix: agency.acquaint_site_prefix,
              myhome_group_id: agency.myhome_group_id,
              myhome_api_key: agency.myhome_api_key,
              daft_api_key: agency.daft_api_key,
              fourpm_branch_id: agency.fourpm_branch_id,
              ghl_id: agency.ghl_id,
              whmcs_id: agency.whmcs_id,
              total_properties: agency.properties_total || 0,
            });

          if (insertError) {
            console.error(`[AGENCIES] Error inserting agency ${agency.unique_key}:`, insertError);
            errors++;
          } else {
            inserted++;
            existingKeys.set(agency.unique_key, 0); // Add to tracking
          }
        }
      }

      console.log(`[AGENCIES] Sync complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);

      // Return the synced agencies from database
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

    // Regular fetch (no sync)
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