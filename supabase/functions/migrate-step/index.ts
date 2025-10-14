import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OLD_SUPABASE_URL = "https://oikseiowedzgosakmkkf.supabase.co";
const OLD_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa3NlaW93ZWR6Z29zYWtta2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg0NDU2MCwiZXhwIjoyMDc1NDIwNTYwfQ.QC4eKknZy6CTB260AWZDhfnCPco6rfL9LJsHBfRYfLs";

interface MigrationRequest {
  table: string;
  batchSize?: number;
  offset?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { table, batchSize = 100, offset = 0 }: MigrationRequest = await req.json();

    const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SERVICE_ROLE);
    const newSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = oldSupabase.from(table).select("*").range(offset, offset + batchSize - 1);

    if (table === "agencies") {
      query = query.order("id", { ascending: true });
    } else if (table === "properties" || table === "properties_data") {
      query = query.order("id", { ascending: true });
    } else if (table === "field_mappings") {
      query = query.order("id", { ascending: true });
    }

    const { data: oldData, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch from old DB: ${fetchError.message}`);
    }

    console.log(`Sample record from ${table}:`, oldData && oldData.length > 0 ? JSON.stringify(oldData[0]) : 'No data');

    if (!oldData || oldData.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No more data to migrate",
          migrated: 0,
          hasMore: false
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const mappedData = oldData;

    const { error: insertError } = await newSupabase
      .from(table)
      .upsert(mappedData, { onConflict: "id" });

    if (insertError) {
      throw new Error(`Failed to insert into new DB: ${insertError.message}`);
    }

    const hasMore = oldData.length === batchSize;

    return new Response(
      JSON.stringify({
        success: true,
        table,
        migrated: oldData.length,
        offset,
        nextOffset: offset + oldData.length,
        hasMore,
        message: `Migrated ${oldData.length} records from ${table}`
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
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