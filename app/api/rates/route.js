import { NextResponse } from 'next/server';

export async function POST(request) {
  // Define common CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Allows all origins (consider restricting in production)
    'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allowed methods
    'Access-Control-Allow-Headers': 'Content-Type', // Allowed headers
    'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
  };

  // Handle preflight OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders, // Apply common CORS headers
    });
  }

  // Retrieve ShipStation API keys from environment variables
  const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;
  const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET;

  // Validate if API keys are configured
  if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
    return NextResponse.json(
      { message: 'Server configuration error: ShipStation API keys not found.' },
      {
        status: 500,
        headers: corsHeaders, // Apply common CORS headers to error response
      }
    );
  }

  let requestBody;
  try {
    // Attempt to parse the request body as JSON
    requestBody = await request.json();
  } catch (parseError) {
    // Handle invalid JSON in the request body
    return NextResponse.json(
      { message: 'Bad Request: Invalid JSON in request body.', error: parseError.message },
      {
        status: 400,
        headers: corsHeaders, // Apply common CORS headers to error response
      }
    );
  }

  // Encode API key and secret for Basic Authorization
  const authString = Buffer.from(
    `${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`
  ).toString('base64');

  try {
    // Make the request to ShipStation's Get Rates API
    const response = await fetch('https://ssapi.shipstation.com/shipments/getrates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(requestBody), // Send the parsed request body to ShipStation
    });

    // Check if the ShipStation API call was successful
    if (!response.ok) {
      // If ShipStation returns an error, parse its error response
      const shipstationErrorData = await response.json();
      console.error('ShipStation API error:', shipstationErrorData);
      return NextResponse.json(shipstationErrorData, {
        status: response.status,
        headers: corsHeaders, // Apply common CORS headers to ShipStation error response
      });
    }

    // If successful, parse the ShipStation response data
    const data = await response.json();

    // Return the rates data to the client
    return NextResponse.json(data, {
      status: 200,
      headers: corsHeaders, // Apply common CORS headers to successful response
    });
  } catch (fetchError) {
    // Catch any network errors or issues during the fetch operation itself
    console.error('Error calculating rates from ShipStation (network/fetch error):', fetchError);
    return NextResponse.json(
      { message: 'Internal Server Error: Could not connect to ShipStation API.', error: fetchError.message },
      {
        status: 500,
        headers: corsHeaders, // Apply common CORS headers to network error response
      }
    );
  }
}
