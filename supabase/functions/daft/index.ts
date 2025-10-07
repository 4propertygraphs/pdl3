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
    const propertyId = url.searchParams.get('id');

    if (!apiKey || !propertyId) {
      return new Response(
        JSON.stringify({ error: 'API key and property ID are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Call Daft API (you'll need to implement the actual Daft API endpoint)
    // For now, returning a placeholder
    const daftResponse = await fetch(`https://api.daft.ie/v1/properties/${propertyId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!daftResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Daft API', status: daftResponse.status }),
        {
          status: daftResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await daftResponse.json();

    return new Response(
      JSON.stringify(data),
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