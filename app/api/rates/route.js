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

  // Enhanced environment variable validation
  if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
    console.error('ShipStation API configuration error:', {
      hasApiKey: !!SHIPSTATION_API_KEY,
      hasApiSecret: !!SHIPSTATION_API_SECRET,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        message: 'Server configuration error: ShipStation API keys not found.',
        errorCode: 'MISSING_API_CREDENTIALS'
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }

  let requestBody;
  try {
    requestBody = await request.json();
    
    // Log the incoming request for debugging
    console.log('Incoming request body:', {
      bodyKeys: Object.keys(requestBody || {}),
      bodySize: JSON.stringify(requestBody).length,
      timestamp: new Date().toISOString()
    });

    // Basic validation of required fields (adjust based on ShipStation API requirements)
    if (!requestBody || typeof requestBody !== 'object') {
      throw new Error('Request body must be a valid object');
    }

  } catch (parseError) {
    console.error('JSON parsing error:', {
      error: parseError.message,
      contentType: request.headers.get('content-type'),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        message: 'Bad Request: Invalid JSON in request body.', 
        error: parseError.message,
        errorCode: 'INVALID_JSON'
      },
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
    console.log('Making request to ShipStation API:', {
      url: 'https://ssapi.shipstation.com/shipments/getrates',
      timestamp: new Date().toISOString()
    });

    const response = await fetch('https://ssapi.shipstation.com/shipments/getrates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Enhanced response handling
    console.log('ShipStation API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    });

    let data;
    const responseText = await response.text();
    
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse ShipStation response as JSON:', {
        error: jsonError.message,
        responseText: responseText.substring(0, 500), // Log first 500 chars
        responseStatus: response.status,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        {
          message: 'ShipStation API returned invalid JSON response',
          error: jsonError.message,
          responseStatus: response.status,
          errorCode: 'INVALID_API_RESPONSE'
        },
        {
          status: 502,
          headers: corsHeaders,
        }
      );
    }

    // Handle non-2xx responses from ShipStation API
    if (!response.ok) {
      console.error('ShipStation API error response:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        {
          message: 'ShipStation API request failed',
          shipstationError: data,
          status: response.status,
          statusText: response.statusText,
          errorCode: 'SHIPSTATION_API_ERROR'
        },
        {
          status: response.status >= 500 ? 502 : response.status,
          headers: corsHeaders,
        }
      );
    }

    // Enhanced data validation and sorting
    console.log('Processing successful response:', {
      dataType: typeof data,
      isArray: Array.isArray(data),
      dataLength: Array.isArray(data) ? data.length : 'N/A',
      timestamp: new Date().toISOString()
    });

    // 💰 Sort the data by shipmentCost in ascending order
    if (Array.isArray(data)) {
      // Validate that items have shipmentCost before sorting
      const validItems = data.filter(item => 
        item && typeof item.shipmentCost === 'number' && !isNaN(item.shipmentCost)
      );
      
      if (validItems.length !== data.length) {
        console.warn('Some items missing valid shipmentCost:', {
          totalItems: data.length,
          validItems: validItems.length,
          timestamp: new Date().toISOString()
        });
      }

      validItems.sort((a, b) => a.shipmentCost - b.shipmentCost);
      data = validItems;
    } else if (data && data.Message) {
      // ShipStation sometimes returns error messages in this format
      console.error('ShipStation returned error message:', {
        message: data.Message,
        data: data,
        timestamp: new Date().toISOString()
      });
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (fetchError) {
    console.error('Fetch error details:', {
      name: fetchError.name,
      message: fetchError.message,
      stack: fetchError.stack,
      cause: fetchError.cause,
      timestamp: new Date().toISOString()
    });

    // Determine error type for better client handling
    let errorCode = 'NETWORK_ERROR';
    let statusCode = 500;

    if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
      errorCode = 'NETWORK_CONNECTION_ERROR';
      statusCode = 503;
    } else if (fetchError.name === 'AbortError') {
      errorCode = 'REQUEST_TIMEOUT';
      statusCode = 504;
    }

    return NextResponse.json(
      {
        message: 'Internal Server Error: Could not connect to ShipStation API.',
        error: fetchError.message,
        errorType: fetchError.name,
        errorCode: errorCode,
        timestamp: new Date().toISOString()
      },
      {
        status: statusCode,
        headers: corsHeaders,
      }
    );
  }
}
