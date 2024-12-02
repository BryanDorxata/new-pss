import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for fetching products
);

export async function GET() {
  try {
    // Set CORS headers to allow the request
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Allow all origins, you can specify your Webflow URL if needed
      'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
      'Access-Control-Allow-Methods': 'GET', // Allow GET method
    };

    // Query products from the database (you can adjust this as needed)
    const { data, error } = await supabase.from('products').select('*');

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
