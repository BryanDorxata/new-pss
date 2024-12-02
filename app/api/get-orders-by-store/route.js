export async function POST(req) {
  const { store_reference } = await req.json();

  if (!store_reference) {
    return new Response(
      JSON.stringify({ error: 'Store reference is required' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
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
          'Access-Control-Allow-Origin': '*',
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
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
