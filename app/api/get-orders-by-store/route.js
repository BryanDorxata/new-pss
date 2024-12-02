import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    // Handle CORS for actual request
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Allow all origins
      'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allowed methods
      'Access-Control-Allow-Headers': 'Content-Type', // Allowed headers
    };

    // Handle OPTIONS request for CORS preflight check
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const storeReference = searchParams.get('store_reference');

    if (!storeReference) {
      return new Response(
        JSON.stringify({ error: 'Store reference is required' }),
        { status: 400, headers }
      );
    }

    // Query the orders table based on store reference
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_reference', storeReference);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers }
      );
    }

    // Return the fetched orders
    return new Response(
      JSON.stringify(data),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('Error fetching orders:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
