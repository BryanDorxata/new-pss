export async function POST(req) {
  try {
    // Handle the request (e.g., fetching data from Supabase)
    const { storefrontId } = await req.json();

    // Your logic to retrieve the data by storefrontId goes here...

    const responseData = {
      success: true,
      data: { /* your retrieved data */ }
    };

    // Set CORS headers to allow requests from any origin
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow all origins (or specify your Webflow domain here)
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Allow all origins (or specify your Webflow domain here)
        },
      }
    );
  }
}
