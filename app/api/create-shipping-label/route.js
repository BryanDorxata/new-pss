import axios from 'axios';

export async function OPTIONS() {
  // Handle CORS preflight request
  return new Response(null, {
    status: 204, // No content response for preflight
    headers: {
      'Access-Control-Allow-Origin': '*', // Allow any origin
      'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allow necessary headers
    },
  });
}

export async function POST(request) {
  try {
    // Parse the request body (it will be JSON)
    const payload = await request.json();

    // Your ShipStation API credentials
    const apiKey = process.env.SHIPSTATION_API_KEY;
    const apiSecret = process.env.SHIPSTATION_API_SECRET;
    
    // Construct the Basic Authorization header for ShipStation
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    // Set up headers for ShipStation API
    const requestHeaders = {
      'Host': 'ssapi.shipstation.com',
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };

    // Make the request to the ShipStation API
    const shipStationResponse = await axios.post(
      'https://ssapi.shipstation.com/shipments/createlabel', 
      payload, 
      { headers: requestHeaders }
    );

    // CORS headers to allow Webflow requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Allow any origin
      'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allow necessary headers
      'Content-Type': 'application/json', // Ensure JSON content-type is returned
    };

    // Return ShipStation response with CORS headers
    return new Response(JSON.stringify(shipStationResponse.data), {
      status: 200,
      headers: corsHeaders, // Add the CORS headers to the response
    });

  } catch (error) {
    // Log and handle any errors
    console.error('Error creating shipping label:', error);
    return new Response(
      JSON.stringify({ error: 'Error creating shipping label', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, // Add CORS to error response
      }
    );
  }
}
