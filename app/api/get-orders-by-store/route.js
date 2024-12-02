export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Allow all origins (or specify the Webflow origin)
      'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
      'Access-Control-Allow-Headers': 'Content-Type', // Allow the Content-Type header
    },
  });
}

export async function POST(req) {
  try {
    const { store_reference } = await req.json();

    if (!store_reference) {
      return new Response(
        JSON.stringify({ error: 'Store reference is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Allow all origins
          },
        }
      );
    }

    // Query your database with the store_reference to fetch orders
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_reference', store_reference);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Allow all origins
          },
        }
      );
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Allow all origins
        },
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
          'Access-Control-Allow-Origin': '*', // Allow all origins
        },
      }
    );
  }
}
