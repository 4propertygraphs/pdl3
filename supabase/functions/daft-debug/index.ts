const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

    const status = response.status;
    const headers = Object.fromEntries(response.headers.entries());
    const html = await response.text();

    console.log('📊 Status:', status);
    console.log('📄 HTML length:', html.length);

    const hasNextData = html.includes('__NEXT_DATA__');
    const hasListings = html.includes('listings');
    
    let nextData = null;
    let listingsCount = 0;
    
    if (hasNextData) {
      try {
        const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (scriptMatch) {
          nextData = JSON.parse(scriptMatch[1]);
          const listings = nextData?.props?.pageProps?.listings || [];
          listingsCount = listings.length;
          console.log('✅ Found', listingsCount, 'listings in __NEXT_DATA__');
        }
      } catch (e) {
        console.error('❌ Error parsing __NEXT_DATA__:', e.message);
      }
    }

    const htmlPreview = html.substring(0, 2000);
    const htmlEnd = html.substring(Math.max(0, html.length - 500));

    const result = {
      success: true,
      url: testUrl,
      status,
      responseHeaders: headers,
      htmlLength: html.length,
      checks: {
        hasNextData,
        hasListings,
        listingsCount,
        hasTitle: html.includes('<title>'),
        hasBody: html.includes('<body'),
        hasHead: html.includes('<head'),
        hasReact: html.includes('__NEXT'),
        hasCloudflare: html.toLowerCase().includes('cloudflare'),
        hasCaptcha: html.toLowerCase().includes('captcha'),
      },
      htmlPreview,
      htmlEnd,
      nextDataSample: nextData ? {
        hasProps: !!nextData.props,
        hasPageProps: !!nextData.props?.pageProps,
        hasListings: !!nextData.props?.pageProps?.listings,
        listingsCount,
        firstListing: nextData.props?.pageProps?.listings?.[0] || null,
      } : null,
    };

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
