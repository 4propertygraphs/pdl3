# Daft.ie Scraper Documentation

## Overview
Comprehensive scraping system for Daft.ie property listings with full and incremental modes.

## Architecture

### Database Tables
- **daft_agencies** - Stores agency information from Daft.ie
- **daft_properties** - Stores property listings with full details
- **daft_scrape_queue** - Queue system for sequential processing
- **daft_scrape_log** - Complete history of all scrape operations

### Edge Functions

#### 1. `daft-full-scraper`
Main scraper function with two modes:

**Full Mode** (`?mode=full&maxPages=10`)
- Scrapes ALL 26 Irish counties
- Property types: sale, rent, sharing
- Configurable pages per location
- 3-second delay between requests
- Expected duration: 30-60 minutes

**Incremental Mode** (`?mode=incremental&maxPages=2`)
- Checks 5 oldest agencies
- Updates existing properties
- 2-second delay between requests
- Expected duration: 5-10 minutes

#### 2. `daft-scheduler`
Automatic scheduling system:
- Runs full scrape if: no previous scrape OR last full scrape > 7 days ago
- Otherwise runs incremental scrape
- Prevents parallel execution
- Can be triggered by cron job

## Usage

### Manual Scraping

```bash
# Full scrape (all locations)
curl "${SUPABASE_URL}/functions/v1/daft-full-scraper?mode=full&maxPages=10" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

# Incremental scrape (updates only)
curl "${SUPABASE_URL}/functions/v1/daft-full-scraper?mode=incremental&maxPages=2" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### Automated Scheduling

Set up a cron job (recommended: every 6 hours):

```bash
curl "${SUPABASE_URL}/functions/v1/daft-scheduler" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

## Frontend

### Daft Data Page
Location: `/daft-data`

Features:
- Toggle between Full and Incremental modes
- Real-time scraping status
- Property and Agency tabs
- Search and filtering
- Scrape history logs
- Statistics dashboard

## Data Flow

```
Daft.ie HTML
    ↓
Extract __NEXT_DATA__ JSON
    ↓
Parse properties + agencies
    ↓
Upsert to Supabase
    ↓
Update last_scraped_at timestamps
```

## Scraping Strategy

### Sequential Processing
- NO parallel requests (prevents IP blocking)
- 3-second delay between location pages
- 1.5-second delay between property pages
- Queue system ensures single execution

### Data Extraction
- Extracts from Next.js `__NEXT_DATA__` JSON block
- More reliable than HTML parsing
- Includes full property metadata

### Locations Covered
26 Irish counties:
Dublin, Cork, Galway, Limerick, Waterford, Kilkenny, Wexford, Carlow, Wicklow, Kildare, Meath, Louth, Monaghan, Cavan, Donegal, Sligo, Leitrim, Roscommon, Mayo, Westmeath, Longford, Offaly, Laois, Tipperary, Clare, Kerry

## Recommended Schedule

1. **Initial Setup**: Run Full Scrape once to populate database
2. **Daily**: Run Incremental Scrape every 6 hours
3. **Weekly**: Run Full Scrape once per week to catch new listings

## Monitoring

Check scrape logs:
```sql
SELECT * FROM daft_scrape_log
ORDER BY completed_at DESC
LIMIT 10;
```

Check queue status:
```sql
SELECT * FROM daft_scrape_queue
WHERE status = 'processing';
```

## Error Handling

- Individual property errors don't stop the scrape
- Location errors are logged and skipped
- Failed jobs can be retried manually
- All errors logged in `daft_scrape_log.error_count`

## Performance

Full Scrape:
- ~26 locations × 10 pages × 20 properties = ~5,200 properties
- Duration: 30-60 minutes
- Database writes: ~5,200 properties + ~500 agencies

Incremental Scrape:
- 5 agencies × 2 pages × 20 properties = ~200 properties
- Duration: 5-10 minutes
- Database updates: ~200 properties

## Security

- Service role key required for edge functions
- RLS policies: authenticated users can read, service role can write
- No API keys exposed in frontend
- Sequential processing reduces detection risk
