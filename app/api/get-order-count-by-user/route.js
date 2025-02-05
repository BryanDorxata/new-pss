import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
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
    const { user_uuid } = body;

    if (!user_uuid) {
      return new Response(
        JSON.stringify({ error: 'User UUID is required.' }),
        { status: 400, headers }
      );
    }

    // 1. Get the storefront UUID for the given user
    const { data: storefront, error: storefrontError } = await supabase
      .from('storefront')
      .select('storefront_uuid')
      .eq('user_reference', user_uuid)
      .single(); // Expect only one match

    if (storefrontError || !storefront) {
      return new Response(
        JSON.stringify({ error: 'Storefront not found for this user.' }),
        { status: 404, headers }
      );
    }

    const { storefront_uuid } = storefront;

    // 2. Count the orders for this storefront
    const { count, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_reference', storefront_uuid);

    if (orderError) {
      return new Response(
        JSON.stringify({ error: 'Failed to count orders.', details: orderError.message }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Order count retrieved successfully.',
        storefront_uuid,
        order_count: count,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers }
    );
  }
}
