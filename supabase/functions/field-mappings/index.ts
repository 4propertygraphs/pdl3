import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, apikey, x-api-token, token',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    if (method === 'GET' && (path === '/field-mappings' || path.endsWith('/field-mappings'))) {
      const { data, error } = await supabaseClient
        .from('field_mappings')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify(data),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (method === 'POST' && (path === '/field-mappings' || path.endsWith('/field-mappings'))) {
      const body = await req.json();
      const { field_name, acquaint_crm, propertydrive, daft, myhome, wordpress, order } = body;

      const { data, error } = await supabaseClient
        .from('field_mappings')
        .insert([{
          field_name,
          acquaint_crm: acquaint_crm || '',
          propertydrive: propertydrive || '',
          daft: daft || '',
          myhome: myhome || '',
          wordpress: wordpress || '',
          order: order || 999,
        }])
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify(data),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const putMatch = path.match(/\/field-mappings\/(\d+)$/);
    if (method === 'PUT' && putMatch) {
      const id = parseInt(putMatch[1]);
      const body = await req.json();
      const { field_name, acquaint_crm, propertydrive, daft, myhome, wordpress, order } = body;

      const { data, error } = await supabaseClient
        .from('field_mappings')
        .update({
          field_name,
          acquaint_crm: acquaint_crm || '',
          propertydrive: propertydrive || '',
          daft: daft || '',
          myhome: myhome || '',
          wordpress: wordpress || '',
          order: order !== undefined ? order : 999,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify(data),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const deleteMatch = path.match(/\/field-mappings\/(\d+)$/);
    if (method === 'DELETE' && deleteMatch) {
      const id = parseInt(deleteMatch[1]);

      const { error } = await supabaseClient
        .from('field_mappings')
        .delete()
        .eq('id', id);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Deleted successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
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