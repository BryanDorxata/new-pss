import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();

    // Define the order data (modify as per your table schema)
    const {
      store_reference,
      customer_name,
      customer_email,
      address,
      shipping_details,
      products_ordered,
      confirmation,
      shippingDetails,
      phone_number,
    } = body;

    // Insert the order into the Supabase table and return the inserted row
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          store_reference,
          customer_name,
          customer_email,
          address,
          shipping_details,
          products_ordered,
          confirmation,
          shippingDetails,
          phone_number,
        },
      ])
      .select(); // ✅ Ensures Supabase returns the inserted data

    // Handle errors from Supabase
    if (error) {
      console.error('❌ Error inserting order:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert order.', details: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    console.log('✅ Order inserted successfully:', data);

    // Success response
    return new Response(
      JSON.stringify({ success: true, data }), // ✅ Now properly returning inserted data
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected error occurred.', details: err.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
