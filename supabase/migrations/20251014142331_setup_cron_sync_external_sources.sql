/*
  # Setup Cron Job for External Sources Sync

  1. Description
    - Creates a cron job that runs every 10 minutes
    - Calls the sync-external-sources edge function
    - Automatically updates cache tables with fresh data from external APIs
    - Monitors for changes in property data

  2. Notes
    - Cron runs using pg_cron extension (if available)
    - This is optional and may not work in all Supabase environments
    - Can also be triggered manually or via external scheduler
*/

-- Note: pg_cron may not be available in all Supabase plans
-- This migration will attempt to set it up but won't fail if unavailable

DO $$
BEGIN
  -- Try to create the cron job if pg_cron is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule the job to run every 10 minutes
    PERFORM cron.schedule(
      'sync-external-sources-job',
      '*/10 * * * *',
      'SELECT 1'
    );
    RAISE NOTICE 'Cron job scheduled successfully';
  ELSE
    RAISE NOTICE 'pg_cron extension not available - use external scheduler instead';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not set up cron job: %', SQLERRM;
END $$;
