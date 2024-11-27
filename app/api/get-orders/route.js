import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    // Query all rows from the `orders` table
    const { data, error } = await supabase.from('orders').select('*');

    if (error) {
      throw error; // Handle Supabase error
    }

    // Return the fetched data
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // CORS header
      },
    });
  } catch (error) {
    // Handle errors and return an error response
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // CORS header
        },
      }
    );
  }
}
