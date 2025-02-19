import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

// Handle POST request
export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id } = body;

    // Validate input
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers }
      );
    }

    // 🔹 Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found in the database.' }),
        { status: 404, headers }
      );
    }

    // 🔹 Fetch storefront using user_reference
    const { data: storefront, error: storefrontError } = await supabase
      .from('storefront')
      .select('*')
      .eq('user_reference', user_id)
      .single();

    if (storefrontError || !storefront) {
      return new Response(
        JSON.stringify({ error: 'Storefront not found for this user.' }),
        { status: 404, headers }
      );
    }

    // ✅ Return storefront row
    return new Response(JSON.stringify({ storefront }), { status: 200, headers });

  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers }
    );
  }
}
