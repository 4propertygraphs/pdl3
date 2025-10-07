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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const key = url.searchParams.get("key");

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

    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('*')
      .eq('unique_key', key)
      .maybeSingle();

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ error: "Agency not found" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response = await fetch("https://api.stefanmars.nl/api/properties", {
      method: "GET",
      headers: {
        "token": apiToken,
        "key": key,
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch properties from 4PM" }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apiData = await response.json();

    for (const prop of apiData) {
      await supabaseClient
        .from('properties')
        .upsert({
          agency_id: agency.id,
          external_id: prop.ListReff,
          house_location: prop.Address,
          house_price: prop.Price,
          house_bedrooms: prop.Bedrooms,
          house_bathrooms: prop.Bathrooms,
          house_mt_squared: prop.Size,
          house_extra_info_1: prop.PropertyType,
          house_extra_info_2: prop.BER,
          house_extra_info_3: prop.AddressOnly,
          house_extra_info_4: prop.SaleType,
          agency_agent_name: prop.AgentName,
          agency_name: prop.AgencyName || agency.name,
          images_url_house: Array.isArray(prop.FileName) ? prop.FileName.join(',') : prop.FileName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'external_id,agency_id'
        });
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