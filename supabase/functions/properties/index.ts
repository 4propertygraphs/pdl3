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

async function cacheExternalSources(supabaseClient: any, agency: any, propertyId: string, apiToken: string) {
  const tasks = [];

  if (agency.daft_api_key) {
    tasks.push((async () => {
      try {
        const response = await fetch(`https://api.stefanmars.nl/api/daft?key=${agency.daft_api_key}&id=${propertyId}`, {
          headers: { token: apiToken },
        });
        if (response.ok) {
          const text = await response.text();
          if (text && text.trim() !== "") {
            const data = JSON.parse(text);
            const apiCreated = extractDate(data, 'startDate');
            await supabaseClient.from('daft_properties').upsert({
              agency_id: agency.id,
              external_id: propertyId,
              raw_data: data,
              api_created_at: apiCreated,
              api_modified_at: null,
              last_fetched: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'agency_id,external_id' });
          }
        }
      } catch (e) {
        console.error('Daft cache error:', e);
      }
    })());
  }

  if (agency.myhome_api_key) {
    tasks.push((async () => {
      try {
        const response = await fetch(`https://api.stefanmars.nl/api/myhome?key=${agency.myhome_api_key}&id=${propertyId}`, {
          headers: { token: apiToken },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && Object.keys(data).length > 0) {
            const apiCreated = extractDate(data, 'CreatedOnDate');
            const apiModified = extractDate(data, 'ModifiedOnDate');
            await supabaseClient.from('myhome_properties').upsert({
              agency_id: agency.id,
              external_id: propertyId,
              raw_data: data,
              api_created_at: apiCreated,
              api_modified_at: apiModified,
              last_fetched: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'agency_id,external_id' });
          }
        }
      } catch (e) {
        console.error('MyHome cache error:', e);
      }
    })());
  }

  await Promise.all(tasks);
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
      const cachePromises = [];

      for (const prop of apiProperties) {
        const picsCount = prop.Pics ? (Array.isArray(prop.Pics) ? prop.Pics.length : (typeof prop.Pics === 'string' ? prop.Pics.split(',').length : 0)) : 0;

        await supabaseClient.from('properties').upsert({
          agency_id: agency.id,
          source: prop.Source || 'unknown',
          external_id: prop.ListReff || prop.Id?.toString(),
          address: prop.Address || '',
          price: prop.Price || '',
          beds: parseInt(prop.Beds) || null,
          baths: parseInt(prop.BathRooms) || null,
          size: prop.Size || '',
          size_in_acres: prop.SizeInAcres || '',
          type: prop.Type || '',
          propertymarket: prop.Propertymarket || '',
          status: prop.Status || '',
          agent: prop.Agent || '',
          pics: picsCount.toString(),
          images: Array.isArray(prop.Pics) ? prop.Pics.join(',') : (prop.Pics || ''),
          modified: prop.Modified || new Date().toISOString(),
          parent_id: prop.ParentId || null,
          agency_name: agency.name,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'agency_id,external_id' });

        const apiCreated = extractDate(prop, 'date') || extractDate(prop, 'AddedDate');
        const apiModified = extractDate(prop, 'Modified');

        await supabaseClient.from('wordpress_properties').upsert({
          agency_id: agency.id,
          external_id: prop.ListReff || prop.Id?.toString(),
          raw_data: prop,
          api_created_at: apiCreated,
          api_modified_at: apiModified,
          last_fetched: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'agency_id,external_id' });

        await supabaseClient.from('acquaint_properties').upsert({
          agency_id: agency.id,
          external_id: prop.ListReff || prop.Id?.toString(),
          raw_data: prop,
          api_created_at: apiCreated,
          api_modified_at: apiModified,
          last_fetched: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'agency_id,external_id' });

        cachePromises.push(
          cacheExternalSources(supabaseClient, agency, prop.ListReff || prop.Id?.toString(), apiToken)
        );
      }

      await Promise.all(cachePromises);
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

    const transformedProperties = (properties || []).map((prop: any) => ({
      id: prop.id,
      Id: prop.id,
      ParentId: prop.parent_id,
      Address: prop.address || prop.house_location || '',
      Price: prop.price || prop.house_price || '',
      Beds: prop.beds || prop.house_bedrooms || '',
      Size: prop.size || prop.house_mt_squared || prop.sqm || '',
      SizeInAcres: prop.size_in_acres || '',
      Type: prop.type || prop.property_type || '',
      Propertymarket: prop.propertymarket || prop.sale_type || '',
      Status: prop.status || '',
      Agent: prop.agent || prop.agent_name || prop.agency_agent_name || '',
      Modified: prop.modified || prop.updated_at || '',
      Pics: prop.pics || prop.images || '',
      Office: prop.agency_name || '',
      BathRooms: prop.baths || prop.house_bathrooms || '',
    }));

    return new Response(JSON.stringify(transformedProperties), {
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
