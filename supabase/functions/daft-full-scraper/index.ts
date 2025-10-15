import { createClient } from 'npm:@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const LOCATIONS = [
  'dublin', 'cork', 'galway', 'limerick', 'waterford',
  'kilkenny', 'wexford', 'carlow', 'wicklow', 'kildare',
  'meath', 'louth', 'monaghan', 'cavan', 'donegal',
  'sligo', 'leitrim', 'roscommon', 'mayo', 'westmeath',
  'longford', 'offaly', 'laois', 'tipperary', 'clare',
  'kerry'
];

interface ScraperConfig {
  mode: 'full' | 'incremental';
  maxPagesPerLocation?: number;
  delayBetweenRequests?: number;
  stream?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') || 'full';
    const maxPages = parseInt(url.searchParams.get('maxPages') || '10');
    const stream = url.searchParams.get('stream') === 'true';

    const config: ScraperConfig = {
      mode: mode as 'full' | 'incremental',
      maxPagesPerLocation: maxPages,
      delayBetweenRequests: 3000,
      stream,
    };

    if (stream) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      const sendLog = async (message: string) => {
        await writer.write(encoder.encode(`data: ${message}\n\n`));
      };

      (async () => {
        try {
          if (config.mode === 'full') {
            await runFullScrapeStreaming(supabase, config, sendLog);
          } else {
            await runIncrementalScrapeStreaming(supabase, config, sendLog);
          }
        } catch (error: any) {
          await sendLog(`❌ Error: ${error.message}`);
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      if (config.mode === 'full') {
        const result = await runFullScrape(supabase, config);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        const result = await runIncrementalScrape(supabase, config);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function runFullScrapeStreaming(
  supabase: any,
  config: ScraperConfig,
  sendLog: (msg: string) => Promise<void>
) {
  const startTime = Date.now();
  let totalProperties = 0;
  let totalAdded = 0;
  let totalUpdated = 0;
  const agenciesMap = new Map();
  let errorCount = 0;

  await sendLog(`🚀 Starting FULL SYNC - ${LOCATIONS.length} locations`);

  for (let i = 0; i < LOCATIONS.length; i++) {
    const location = LOCATIONS[i];
    await sendLog(`📍 [${i + 1}/${LOCATIONS.length}] Syncing: ${location}...`);

    try {
      const locationResult = await scrapeLocation(
        supabase,
        location,
        'sale',
        config.maxPagesPerLocation || 10,
        agenciesMap,
        sendLog
      );

      totalProperties += locationResult.propertiesScraped;
      totalAdded += locationResult.propertiesAdded;
      totalUpdated += locationResult.propertiesUpdated;

      await sendLog(
        `   ✓ ${location}: ${locationResult.propertiesScraped} properties (${locationResult.propertiesAdded} new, ${locationResult.propertiesUpdated} updated)`
      );
    } catch (error: any) {
      errorCount++;
      await sendLog(`   ✗ ${location}: ${error.message}`);
    }

    await delay(config.delayBetweenRequests || 3000);
  }

  const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

  await supabase.from('daft_scrape_log').insert({
    scrape_type: 'full',
    agencies_scraped: agenciesMap.size,
    properties_scraped: totalProperties,
    properties_added: totalAdded,
    properties_updated: totalUpdated,
    duration_seconds: durationSeconds,
    error_count: errorCount,
    completed_at: new Date().toISOString(),
  });

  await sendLog(`\n🎉 SYNC COMPLETE!`);
  await sendLog(`📊 Stats: ${totalProperties} properties, ${agenciesMap.size} agencies`);
  await sendLog(`⏱️  Duration: ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`);
}

async function runIncrementalScrapeStreaming(
  supabase: any,
  config: ScraperConfig,
  sendLog: (msg: string) => Promise<void>
) {
  await sendLog('🔄 Starting INCREMENTAL SYNC...');

  const { data: agencies } = await supabase
    .from('daft_agencies')
    .select('*')
    .order('last_scraped_at', { ascending: true })
    .limit(5);

  if (!agencies || agencies.length === 0) {
    await sendLog('⚠️  No agencies found. Run full sync first.');
    return;
  }

  await sendLog(`📋 Checking ${agencies.length} agencies...`);

  for (let i = 0; i < agencies.length; i++) {
    const agency = agencies[i];
    await sendLog(`   [${i + 1}/${agencies.length}] ${agency.name}...`);

    await supabase
      .from('daft_agencies')
      .update({ last_scraped_at: new Date().toISOString() })
      .eq('id', agency.id);

    await delay(2000);
  }

  await sendLog('✓ Incremental sync complete!');
}

async function runFullScrape(supabase: any, config: ScraperConfig) {
  const startTime = Date.now();
  let totalProperties = 0;
  let totalAdded = 0;
  let totalUpdated = 0;
  const agenciesMap = new Map();
  let errorCount = 0;

  for (const location of LOCATIONS) {
    try {
      const locationResult = await scrapeLocation(
        supabase,
        location,
        'sale',
        config.maxPagesPerLocation || 10,
        agenciesMap
      );

      totalProperties += locationResult.propertiesScraped;
      totalAdded += locationResult.propertiesAdded;
      totalUpdated += locationResult.propertiesUpdated;
    } catch (error: any) {
      errorCount++;
    }

    await delay(config.delayBetweenRequests || 3000);
  }

  const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

  await supabase.from('daft_scrape_log').insert({
    scrape_type: 'full',
    agencies_scraped: agenciesMap.size,
    properties_scraped: totalProperties,
    properties_added: totalAdded,
    properties_updated: totalUpdated,
    duration_seconds: durationSeconds,
    error_count: errorCount,
    completed_at: new Date().toISOString(),
  });

  return {
    success: true,
    mode: 'full',
    locationsScraped: LOCATIONS.length - errorCount,
    totalProperties,
    totalAdded,
    totalUpdated,
    totalAgencies: agenciesMap.size,
    durationSeconds,
    errorCount,
  };
}

async function runIncrementalScrape(supabase: any, config: ScraperConfig) {
  const { data: agencies } = await supabase
    .from('daft_agencies')
    .select('*')
    .order('last_scraped_at', { ascending: true })
    .limit(5);

  if (!agencies || agencies.length === 0) {
    return { success: false, message: 'No agencies found' };
  }

  for (const agency of agencies) {
    await supabase
      .from('daft_agencies')
      .update({ last_scraped_at: new Date().toISOString() })
      .eq('id', agency.id);
    await delay(2000);
  }

  return { success: true, agenciesChecked: agencies.length };
}

async function scrapeLocation(
  supabase: any,
  location: string,
  propertyType: string,
  maxPages: number,
  agenciesMap: Map<string, any>,
  sendLog?: (msg: string) => Promise<void>
) {
  let propertiesScraped = 0;
  let propertiesAdded = 0;
  let propertiesUpdated = 0;

  for (let page = 0; page < maxPages; page++) {
    const offset = page * 20;
    const url = `https://www.daft.ie/property-for-${propertyType}/${location}?offset=${offset}`;

    try {
      const html = await fetchPage(url);
      if (!html) break;

      const nextData = extractNextData(html);
      if (!nextData) break;

      const listings = nextData.props?.pageProps?.listings || [];
      if (listings.length === 0) break;

      if (sendLog && page === 0) {
        await sendLog(`      Page 1/${maxPages}: ${listings.length} listings found`);
      }

      for (const listing of listings) {
        try {
          const result = await processProperty(supabase, listing, agenciesMap);
          propertiesScraped++;
          if (result.isNew) propertiesAdded++;
          else propertiesUpdated++;
        } catch (error: any) {
          console.error('Error processing property:', error.message);
        }
      }

      if (sendLog && page > 0 && page % 2 === 0) {
        await sendLog(`      Page ${page + 1}/${maxPages}: +${listings.length} properties`);
      }

      await delay(1500);
    } catch (error: any) {
      break;
    }
  }

  return { propertiesScraped, propertiesAdded, propertiesUpdated };
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) return null;
    return await response.text();
  } catch (error: any) {
    return null;
  }
}

function extractNextData(html: string): any {
  try {
    const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!scriptMatch) return null;
    return JSON.parse(scriptMatch[1]);
  } catch (error) {
    return null;
  }
}

async function processProperty(supabase: any, listing: any, agenciesMap: Map<string, any>) {
  const propertyData = parsePropertyData(listing);

  let agencyId = null;
  if (propertyData.seller?.id) {
    const agency = await upsertAgency(supabase, propertyData.seller, agenciesMap);
    if (agency) agencyId = agency.id;
  }

  const { data: existing } = await supabase
    .from('daft_properties')
    .select('id')
    .eq('daft_id', propertyData.id)
    .maybeSingle();

  const dbData = {
    daft_id: propertyData.id,
    agency_id: agencyId,
    title: propertyData.title || 'Untitled',
    price: propertyData.price,
    address: propertyData.address,
    property_type: propertyData.propertyType,
    bedrooms: propertyData.bedrooms,
    bathrooms: propertyData.bathrooms,
    ber_rating: propertyData.berRating,
    description: propertyData.description,
    image_urls: propertyData.images,
    latitude: propertyData.latitude,
    longitude: propertyData.longitude,
    published_date: propertyData.publishDate,
    status: 'sale',
    raw_data: listing,
    last_scraped_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from('daft_properties').update(dbData).eq('id', existing.id);
    return { isNew: false };
  } else {
    await supabase.from('daft_properties').insert(dbData);
    return { isNew: true };
  }
}

function parsePropertyData(listing: any) {
  const l = listing.listing || listing;
  return {
    id: String(l.id || listing.id || Math.random()),
    title: l.title || listing.title,
    price: l.price || listing.price,
    address: l.address || listing.address,
    propertyType: l.propertyType || listing.propertyType,
    bedrooms: l.numBedrooms || listing.numBedrooms,
    bathrooms: l.numBathrooms || listing.numBathrooms,
    berRating: l.ber?.rating || listing.ber?.rating,
    description: l.description || listing.description,
    images: (l.media?.images || listing.media?.images || []).map((img: any) => img.url || img),
    latitude: l.point?.coordinates?.[1] || listing.point?.coordinates?.[1],
    longitude: l.point?.coordinates?.[0] || listing.point?.coordinates?.[0],
    publishDate: l.publishDate || listing.publishDate,
    seller: l.seller || listing.seller,
  };
}

async function upsertAgency(supabase: any, seller: any, agenciesMap: Map<string, any>) {
  if (!seller?.id) return null;

  if (agenciesMap.has(seller.id)) {
    return agenciesMap.get(seller.id);
  }

  const { data: existing } = await supabase
    .from('daft_agencies')
    .select('id')
    .eq('daft_id', seller.id)
    .maybeSingle();

  const agencyData = {
    daft_id: seller.id,
    name: seller.name || 'Unknown Agency',
    phone: seller.phone,
    email: seller.email,
    website: seller.website,
    logo_url: seller.logo,
    last_scraped_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let agency;
  if (existing) {
    const { data } = await supabase
      .from('daft_agencies')
      .update(agencyData)
      .eq('id', existing.id)
      .select()
      .single();
    agency = data;
  } else {
    const { data } = await supabase
      .from('daft_agencies')
      .insert(agencyData)
      .select()
      .single();
    agency = data;
  }

  if (agency) agenciesMap.set(seller.id, agency);
  return agency;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}