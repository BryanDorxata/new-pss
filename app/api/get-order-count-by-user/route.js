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
        JSON.stringify({ error: 'User UUID is required.' }),
        { status: 400, headers }
      );
    }

    // **Step 1: Check if the user exists**
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('uuid')
      .eq('id', body.user_uuid)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found in the database.' }),
        { status: 404, headers }
      );
    }

    // **Step 2: Check if the storefront exists for this user**
    const { data: storefrontData, error: storefrontError } = await supabase
      .from('storefront')
      .select('storefront_uuid')
      .eq('user_reference', body.user_uuid)
      .single();

    if (storefrontError || !storefrontData) {
      return new Response(
        JSON.stringify({ error: 'Storefront not found for this user.' }),
        { status: 404, headers }
      );
    }

    // **Step 3: Check if there are orders for this storefront**
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('storefront_reference', storefrontData.storefront_uuid);

    if (ordersError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching orders.', details: ordersError.message }),
        { status: 500, headers }
      );
    }

    if (!ordersData || ordersData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No orders found for this storefront.' }),
        { status: 404, headers }
      );
    }

    // **Return Order Count**
    return new Response(
      JSON.stringify({ message: 'Orders found', order_count: ordersData.length }),
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
