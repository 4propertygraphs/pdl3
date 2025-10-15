import { createClient } from 'npm:@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: isRunning } = await supabase
      .from('daft_scrape_queue')
      .select('id')
      .eq('status', 'processing')
      .maybeSingle();

    if (isRunning) {
      console.log('Scraper already running, skipping...');
      return new Response(JSON.stringify({ status: 'busy', message: 'Scraper already running' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: lastScrape } = await supabase
      .from('daft_scrape_log')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const shouldRunFullScrape = !lastScrape || 
      (lastScrape.scrape_type !== 'full') ||
      (new Date().getTime() - new Date(lastScrape.completed_at).getTime() > 7 * 24 * 60 * 60 * 1000);

    const mode = shouldRunFullScrape ? 'full' : 'incremental';
    
    console.log(`Scheduling ${mode} scrape...`);

    const scraperUrl = `${supabaseUrl}/functions/v1/daft-full-scraper?mode=${mode}&maxPages=${mode === 'full' ? '5' : '2'}`;
    
    const response = await fetch(scraperUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    const result = await response.json();

    return new Response(JSON.stringify({
      success: true,
      scheduled: mode,
      result,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Scheduler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
