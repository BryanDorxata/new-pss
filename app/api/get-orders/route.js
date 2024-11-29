import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Query the orders table
    const { data, error } = await supabase
      .from('orders')
      .select('*');
      
    // Log the response for debugging
    console.log('Data:', data);
    console.log('Error:', error);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',  // Disable caching
            'Pragma': 'no-cache',  // Disable caching for HTTP/1.0 requests
            'Expires': '0'         // Set expiry to 0
          } 
        }
      );
    }

    // Return the data with no-cache headers to prevent caching
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',  // Disable caching
          'Pragma': 'no-cache',  // Disable caching for HTTP/1.0 requests
          'Expires': '0'         // Set expiry to 0
        }
      }
    );
  } catch (err) {
    console.error('Error fetching orders:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',  // Disable caching
          'Pragma': 'no-cache',  // Disable caching for HTTP/1.0 requests
          'Expires': '0'         // Set expiry to 0
        }
      }
    );
  }
}
