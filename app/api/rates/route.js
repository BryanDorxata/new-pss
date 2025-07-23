import { NextResponse } from 'next/server';

export async function POST(request) {
  // Handle preflight OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allows all origins (consider restricting in production)
        'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allowed methods
        'Access-Control-Allow-Headers': 'Content-Type', // Allowed headers
        'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
      },
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
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  let requestBody;
  try {
    // Attempt to parse the request body as JSON
    requestBody = await request.json();
  } catch (parseError) { // Changed 'error' to 'parseError' for clarity and to avoid potential ESLint confusion
    // Handle invalid JSON in the request body
    return NextResponse.json(
      { message: 'Bad Request: Invalid JSON in request body.', error: parseError.message },
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
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
        // 'Host': 'ssapi.shipstation.com', // 'Host' header is typically added automatically by fetch
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(requestBody), // Send the parsed request body to ShipStation
    });

    // Check if the ShipStation API call was successful
    if (!response.ok) {
      // If ShipStation returns an error, parse its error response
      const shipstationErrorData = await response.json(); // Renamed from 'errorData' for clarity
      console.error('ShipStation API error:', shipstationErrorData); // Log the error from ShipStation
      return NextResponse.json(shipstationErrorData, { // Return ShipStation's error response to the client
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // If successful, parse the ShipStation response data
    const data = await response.json();

    // Return the rates data to the client
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (fetchError) { // Changed 'error' to 'fetchError' for clarity
    // Catch any network errors or issues during the fetch operation itself
    console.error('Error calculating rates from ShipStation (network/fetch error):', fetchError);
    return NextResponse.json(
      { message: 'Internal Server Error: Could not connect to ShipStation API.', error: fetchError.message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
