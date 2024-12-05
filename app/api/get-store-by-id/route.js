export async function POST(req) {
  try {
    // Extract storefrontId from the request body
    const { storefrontId } = await req.json();

    if (!storefrontId) {
      return new Response(
        JSON.stringify({ error: 'Storefront ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Allow all origins (or specify your Webflow domain here)
          },
        }
      );
    }

    // Now use storefrontId to fetch data from your database (e.g., Supabase)
    const { data, error } = await supabase
      .from('storefront')
      .select('*')
      .eq('id', storefrontId) // Use storefrontId here
      .single();

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
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    // You can log the error here if needed
    console.error("Error processing request:", error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
