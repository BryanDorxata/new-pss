import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use the service role key for insert operations
);

export async function POST(req) {
  try {
    // Parse the request body
    const orderData = await req.json();

    // Insert the data into the orders table
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select();

    // Handle errors
    if (error) {
      throw new Error(error.message);
    }

    // Return success response
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Return error response
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
