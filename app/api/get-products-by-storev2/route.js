import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for fetching products
);
// Handle CORS preflight request
export async function OPTIONS() {
  const headers = {
    'Access-Control-Allow-Origin': '', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 
    'Access-Control-Allow-Headers': 'Content-Type', 
  };
  return new Response(null, { status: 204, headers });
}
export async function POST(req) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '', 
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
    const { store_reference } = await req.json();

    if (!store_reference) {
      return new Response(JSON.stringify({ error: 'Missing store_reference parameter' }), {
        status: 400,
        headers,
      });
    }

    const { data, error } = await supabase
      .from('products_v2') 
      .select('*')
      .eq('store_reference', store_reference);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('Error fetching products by store:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    });
  }
}
