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

    const apiToken = req.headers.get("token") || req.headers.get("x-api-token");
    if (!apiToken) {
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
    const key = url.searchParams.get("key");
    const sync = url.searchParams.get("sync");

    if (!key) {
      return new Response(
        JSON.stringify({ error: "Missing key parameter" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('*')
      .eq('unique_key', key)
      .maybeSingle();

    if (agencyError || !agency) {
      const agenciesResponse = await fetch("https://api.stefanmars.nl/api/agencies", {
        method: "GET",
        headers: {
          "token": apiToken,
        },
      });

      if (!agenciesResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch agencies from 4PM API" }),
          {
            status: agenciesResponse.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const apiAgencies = await agenciesResponse.json();
      const matchingAgency = apiAgencies.find((a: any) => a.unique_key === key);

      if (!matchingAgency) {
        return new Response(
          JSON.stringify({ error: "Agency not found in 4PM API" }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const agencyData = {
        unique_key: matchingAgency.unique_key,
        name: matchingAgency.name || '',
        address: matchingAgency.address || '',
        city: matchingAgency.city || '',
        county: matchingAgency.county || '',
        phone: matchingAgency.phone || '',
        email: matchingAgency.email || '',
        website: matchingAgency.website || '',
        logo_url: matchingAgency.logo_url || '',
        description: matchingAgency.description || '',
        primary_source: matchingAgency.primary_source || '',
        myhome_key: matchingAgency.myhome_key || '',
        acquaint_key: matchingAgency.acquaint_key || '',
        daft_key: matchingAgency.daft_key || '',
      };

      const { data: insertedAgency, error: insertError } = await supabaseClient
        .from('agencies')
        .upsert(agencyData, {
          onConflict: 'unique_key',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (insertError || !insertedAgency) {
        return new Response(
          JSON.stringify({ error: "Failed to insert agency", details: insertError?.message }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      agency = insertedAgency;
    }

    if (sync === 'true') {
      const response = await fetch("https://api.stefanmars.nl/api/properties", {
        method: "GET",
        headers: {
          "token": apiToken,
          "key": key,
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

      const apiProperties = await response.json();

      for (const prop of apiProperties) {
        const propertyData = {
          agency_id: agency.id,
          source: prop.Source || agency.primary_source || 'unknown',
          external_id: prop.ListReff || prop.Id?.toString(),
          house_location: prop.Address || '',
          house_price: prop.Price || '',
          house_bedrooms: parseInt(prop.Bedrooms) || null,
          house_bathrooms: parseInt(prop.Bathrooms) || null,
          house_mt_squared: prop.Size || '',
          house_extra_info_1: prop.PropertyType || '',
          house_extra_info_2: prop.BER || '',
          house_extra_info_3: prop.AddressOnly || prop.Address || '',
          house_extra_info_4: prop.SaleType || '',
          agency_agent_name: prop.AgentName || '',
          agency_name: agency.name,
          images_url_house: Array.isArray(prop.FileName) ? prop.FileName.join(',') : (prop.FileName || ''),
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabaseClient
          .from('properties')
          .upsert(propertyData, {
            onConflict: 'agency_id,external_id',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error('Error upserting property:', upsertError);
        }
      }
    }

    const { data: properties, error: propertiesError } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('agency_id', agency.id)
      .order('updated_at', { ascending: false });

    if (propertiesError) {
      return new Response(
        JSON.stringify({ error: propertiesError.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const transformedProperties = (properties || []).map((prop: any) => ({
      Id: prop.id,
      ListReff: prop.external_id,
      Address: prop.house_location,
      AddressOnly: prop.house_extra_info_3 || prop.house_location,
      Price: prop.house_price,
      Bedrooms: prop.house_bedrooms,
      Bathrooms: prop.house_bathrooms,
      Size: prop.house_mt_squared,
      PropertyType: prop.house_extra_info_1,
      BER: prop.house_extra_info_2,
      SaleType: prop.house_extra_info_4,
      AgentName: prop.agency_agent_name,
      AgencyName: prop.agency_name,
      FileName: prop.images_url_house ? prop.images_url_house.split(',') : [],
      Status: 'For Sale',
      Propertymarket: 'Residential Sales',
      Modified: prop.updated_at,
    }));

    return new Response(JSON.stringify(transformedProperties), {
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