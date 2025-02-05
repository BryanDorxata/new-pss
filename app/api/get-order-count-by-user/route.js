import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

// Handle POST request
export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.user_uuid) {
      return new Response(
        JSON.stringify({ error: 'Missing user UUID' }),
        { status: 400, headers }
      );
    }

    const userUUID = body.user_uuid;

    // Get the storefront UUID associated with the user UUID
    const { data: storefrontData, error: storefrontError } = await supabase
      .from('storefronts')
      .select('uuid')
      .eq('user_uuid', userUUID)
      .single();

    if (storefrontError || !storefrontData) {
      return new Response(
        JSON.stringify({ error: 'Storefront not found for this user' }),
        { status: 404, headers }
      );
    }

    const storefrontUUID = storefrontData.uuid;

    // Get the count of orders related to the storefront UUID
    const { count, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('storefront_uuid', storefrontUUID);

    if (orderError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching orders', details: orderError.message }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({ storefront_uuid: storefrontUUID, order_count: count }),
      { status: 200, headers }
    );

  } catch (err) {
    console.error('Server Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers }
    );
  }
}
