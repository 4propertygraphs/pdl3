import { parse } from 'npm:xml2js@0.6.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, x-api-token',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const apiKey = url.searchParams.get('key');
    let propertyId = url.searchParams.get('id');

    if (!apiKey || !propertyId) {
      return new Response(
        JSON.stringify({ error: 'API key and property ID are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Remove the API key from the property ID if it's prefixed
    if (propertyId.startsWith(apiKey)) {
      propertyId = propertyId.substring(apiKey.length);
    }

    // Fetch XML data from Acquaint CRM
    const acquaintUrl = `https://www.acquaintcrm.co.uk/datafeeds/standardxml/${apiKey}-0.xml`;
    const response = await fetch(acquaintUrl);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Acquaint API', status: response.status }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const xmlText = await response.text();

    // Parse XML to JSON
    const parser = new parse.Parser();
    const result = await parser.parseStringPromise(xmlText);

    // Extract properties from parsed XML
    const properties = result?.data?.properties?.property || [];

    // Find the matching property
    const matchingProperty = properties.find((prop: any) => prop.id && prop.id[0] === propertyId);

    if (!matchingProperty) {
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify(matchingProperty),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});