import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for querying orders
);

// Handle CORS preflight request
export async function OPTIONS() {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin, change this for production
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  return new Response(null, { status: 204, headers });
}

export async function GET(req) {
  try {
    // Get the store_reference from query parameters
    const { searchParams } = new URL(req.url);
    const storeReference = searchParams.get('store_reference');
    
    if (!storeReference) {
      return new Response(
        JSON.stringify({ error: 'Store reference is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Set CORS headers to allow the request
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Allow all origins, change this for production
      'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
      'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET method
    };

    // Query orders table to get orders with the given store_reference
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_reference', storeReference); // Filter by store_reference

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers }
      );
    }

    // Return the response with orders data
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
