export async function GET(req) {
  try {
    // Set CORS headers to allow the request
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Allow all origins
      'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH', // Allow methods you need
    };

    // Query products from the database (you can adjust this as needed)
    const { data, error } = await supabase.from('products').select('*');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      });
    }

    // Return the response with products
    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    });
  }
}
