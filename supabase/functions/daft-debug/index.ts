const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const testUrl = url.searchParams.get('url') || 'https://www.daft.ie/property-for-sale/dublin?offset=0';

    console.log('🔍 Fetching:', testUrl);

    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });

    const html = await response.text();
    console.log('✅ Response received:', html.length, 'bytes');

    const checks = {
      hasNextData: html.includes('__NEXT_DATA__'),
      hasListings: html.includes('SearchPage_') || html.includes('data-testid="listing"'),
      listingsCount: (html.match(/data-testid="listing"/g) || []).length,
      hasTitle: html.includes('<title>'),
      hasPagination: html.includes('pagination'),
      hasImages: html.includes('img'),
    };

    return new Response(
      JSON.stringify({
        success: true,
        url: testUrl,
        status: response.status,
        htmlLength: html.length,
        htmlPreview: html.substring(0, 500),
        checks,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
