import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    // CORS headers to allow Webflow requests
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://branch--docs-pss-5215cc-8aef6a.webflow.io', // Replace with your Webflow URL
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allow methods as needed
    };

    // Handle OPTIONS request for CORS preflight check
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const { searchParams } = new URL(req.url);
    const storeReference = searchParams.get('store_reference');

    // Query the orders table using the store_reference
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

    // Return the data
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