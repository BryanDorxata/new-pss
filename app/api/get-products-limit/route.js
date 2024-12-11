import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for fetching products
);

// Handle CORS preflight request
export async function OPTIONS() {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Change to your Webflow URL for production
    'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow OPTIONS and GET methods
    'Access-Control-Allow-Headers': 'Content-Type', // Allow the Content-Type header
  };

  return new Response(null, { status: 204, headers });
}

export async function GET() {
  try {
    // Set CORS headers to allow the request
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Allow all origins, change this for production
      'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
      'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET method
    };

    // Query up to 10 products from the database
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(10); // Limit the result to 10 rows

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      });
    }

    // Return the response with products
    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    });
  }
}
