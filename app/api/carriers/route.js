// app/api/carriers/route.js

import { NextResponse } from 'next/server';

export async function GET(request) {
  const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;
  const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET;

  // --- CORS Preflight Handling (for OPTIONS requests) ---
  // Browsers send an OPTIONS request before the actual GET request
  // to check if the cross-origin request is allowed.
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': '*', // **IMPORTANT: Replace with your Webflow domain for production**
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
      },
    });
  }
  // --- End CORS Preflight Handling ---


  if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
    return NextResponse.json({ message: 'API keys not configured.' }, { status: 500, headers: {
      'Access-Control-Allow-Origin': '*', // Apply CORS header to error responses too
    }});
  }

  const authString = Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`).toString('base64');

  try {
    const response = await fetch('https://ssapi.shipstation.com/carriers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'ssapi.shipstation.com',
        'Authorization': `Basic ${authString}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status, headers: {
        'Access-Control-Allow-Origin': '*', // Apply CORS header to error responses
      }});
    }

    const data = await response.json();

    // --- Apply CORS Headers to successful responses ---
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // **IMPORTANT: Replace with your Webflow domain for production**
      },
    });

  } catch (error) {
    console.error('Error fetching carriers from ShipStation:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500, headers: {
      'Access-Control-Allow-Origin': '*', // Apply CORS header to error responses
    }});
  }
}