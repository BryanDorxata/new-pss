import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Common CORS headers to avoid repetition
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle CORS preflight request
export async function OPTIONS() {
  return new Response(null, { 
    status: 204, 
    headers: CORS_HEADERS 
  });
}

export async function POST(req) {
  const headers = {
    'Content-Type': 'application/json',
    ...CORS_HEADERS,
  };

  try {
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { status: 400, headers }
      );
    }

    const { store_reference } = body;
    
    if (!store_reference) {
      return new Response(
        JSON.stringify({ error: 'Missing store_reference parameter' }), 
        { status: 400, headers }
      );
    }

    // Validate store_reference is not empty string
    if (typeof store_reference !== 'string' || store_reference.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'store_reference must be a non-empty string' }), 
        { status: 400, headers }
      );
    }

    // Fetch products from Supabase
    const { data, error } = await supabase
      .from('products_v2')
      .select('*')
      .eq('store_reference', store_reference.trim());

    if (error) {
      console.error('Supabase error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch products' }), 
        { status: 500, headers }
      );
    }

    // Return successful response
    return new Response(
      JSON.stringify({ 
        products: data, 
        count: data.length 
      }), 
      { status: 200, headers }
    );

  } catch (err) {
    console.error('Unexpected error fetching products by store:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers }
    );
  }
}
