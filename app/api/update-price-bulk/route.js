import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for updates
);

export async function POST(req) {
  try {
    const { storefrontId } = await req.json();

    if (!storefrontId) {
      return new Response(
        JSON.stringify({ error: 'Storefront ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  // Allow all origins
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',  // Allow specific methods
            'Access-Control-Allow-Headers': 'Content-Type',  // Allow specific headers
          },
        }
      );
    }

    // Fetch the storefront data from your database
    const { data, error } = await supabase
      .from('storefront')
      .select('*')
      .eq('id', storefrontId) // Use storefrontId here
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  // Allow all origins
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',  // Allow specific methods
            'Access-Control-Allow-Headers': 'Content-Type',  // Allow specific headers
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',  // Allow all origins
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',  // Allow specific methods
          'Access-Control-Allow-Headers': 'Content-Type',  // Allow specific headers
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',  // Allow all origins
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',  // Allow specific methods
          'Access-Control-Allow-Headers': 'Content-Type',  // Allow specific headers
        },
      }
    );
  }
}

// Add the OPTIONS method to handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',  // Allow all origins
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',  // Allow specific methods
      'Access-Control-Allow-Headers': 'Content-Type',  // Allow specific headers
    },
  });
}
