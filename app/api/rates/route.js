import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 🔁 Handle preflight request
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 🚀 Handle POST request
export async function POST(request) {
  const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;
  const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET;

  if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
    return NextResponse.json(
      { message: 'Server configuration error: ShipStation API keys not found.' },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (parseError) {
    return NextResponse.json(
      { message: 'Bad Request: Invalid JSON in request body.', error: parseError.message },
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }

  const authString = Buffer.from(
    `${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`
  ).toString('base64');

  try {
    const response = await fetch('https://ssapi.shipstation.com/shipments/getrates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // 💰 Sort the data by shipmentCost in ascending order
    if (Array.isArray(data)) {
      data.sort((a, b) => a.shipmentCost - b.shipmentCost);
    }

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers: corsHeaders,
    });
  } catch (fetchError) {
    return NextResponse.json(
      {
        message: 'Internal Server Error: Could not connect to ShipStation API.',
        error: fetchError.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
