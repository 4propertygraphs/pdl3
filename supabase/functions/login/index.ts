import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
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

    const body = await req.json();
    const { email, password } = body;

    console.log('[LOGIN] Attempting login for:', email);

    const response = await fetch("https://api.stefanmars.nl/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      console.error('[LOGIN] Stefanmars login failed:', response.status);
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'Login failed', status: response.status };
      }
      return new Response(JSON.stringify(errorData), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    let data;
    try {
      const responseText = await response.text();
      console.log('[LOGIN] Raw response:', responseText);
      data = JSON.parse(responseText);
      console.log('[LOGIN] Parsed data:', data);
      console.log('[LOGIN] Stefanmars login successful, token present:', !!data.token);
    } catch (e) {
      console.error('[LOGIN] Failed to parse response:', e);
      return new Response(JSON.stringify({ error: 'Failed to parse login response' }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    if (data.token) {
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ stefanmars_api_token: data.token })
        .eq('email', email);

      if (updateError) {
        console.error('[LOGIN] Error updating user token:', updateError);
      } else {
        console.log('[LOGIN] Successfully stored stefanmars token for user');
      }
    }

    const responseData = {
      ...data,
      stefanmars_token: data.token
    };

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error('[LOGIN] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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