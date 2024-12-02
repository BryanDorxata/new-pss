import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Query the products table to get all products
    const { data, error } = await supabase.from('products').select('*');

    // Handle errors
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Allow all origins
            'Access-Control-Allow-Methods': 'GET', // Allow only GET method
            'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
          },
        }
      );
    }

    // Return the data
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Allow all origins
          'Access-Control-Allow-Methods': 'GET', // Allow only GET method
          'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
        },
      }
    );
  } catch (err) {
    console.error('Error fetching products:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Allow all origins
          'Access-Control-Allow-Methods': 'GET', // Allow only GET method
          'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
        },
      }
    );
  }
}
