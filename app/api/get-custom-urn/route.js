import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use the service role key
);

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Allow all origins for now
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Handle GET requests
export async function GET() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Allow all origins for now
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Fetch all rows from the custom_design table
    const { data, error } = await supabase.from('custom_design').select('*');

    if (error) {
      console.error('Error fetching rows:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
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
  } catch (err) {
    console.error('Error handling request:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
