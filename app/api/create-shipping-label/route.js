import axios from 'axios';

export async function OPTIONS() {
  // Allow CORS for the OPTIONS preflight request
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request) {
  try {
    // Parse the request body
    const payload = await request.json();

    // CORS headers for the POST request
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Your ShipStation API credentials
    const apiKey = process.env.SHIPSTATION_API_KEY;
    const apiSecret = process.env.SHIPSTATION_API_SECRET;
    
    // Construct the Basic Authorization header
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    // Prepare headers for the ShipStation API request
    const requestHeaders = {
      'Host': 'ssapi.shipstation.com',
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };

    // Make the API request to ShipStation
    const response = await axios.post(
      'https://ssapi.shipstation.com/shipments/createlabel', 
      payload, 
      { headers: requestHeaders }
    );

    // Return the response from ShipStation
    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...headers, // Include CORS headers in the response
      },
    });
  } catch (error) {
    console.error('Error creating shipping label:', error);
    return new Response(
      JSON.stringify({ error: 'Error creating shipping label', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
