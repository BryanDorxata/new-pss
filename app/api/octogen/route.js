/**
 * Vercel Function to proxy the Octogen AI agent_search API.
 *
 * This function takes a 'text' query parameter from the user,
 * and then makes a GET request to the Octogen AI API,
 * passing the user-provided text and a fixed limit of 8.
 *
 * This version adds CORS headers to the response and is designed for the Next.js 'app' directory.
 */

import { NextResponse } from 'next/server';

// **Important:**
// 1.  Replace this with your actual Octogen AI key.
// 2.  DO NOT hardcode your API key directly in your Vercel function code in a production environment.
//     Instead, store it as an environment variable in your Vercel project settings.
//     You can access it in your code using `process.env.OCTOGEN_API_KEY`.
const API_KEY = process.env.OCTOGEN_API_KEY;

// 3. Use the correct base URL.
const OCTOGEN_API_BASE_URL = 'https://api.octogen.ai/catalog';

export const runtime = 'edge';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // 1. Get the 'text' query parameter from the user's request.
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');

    // 2. Check if the 'text' parameter is provided.
    if (!text) {
      return NextResponse.json(
        { error: 'Missing "text" query parameter.' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
          },
        }
      );
    }

    // 3. Construct the URL for the Octogen AI API request.
    const octogenApiUrl = `${OCTOGEN_API_BASE_URL}/agent_search?text=${encodeURIComponent(
      text
    )}&limit=8`;

    // 4. Make the GET request to the Octogen AI API.
    const response = await fetch(octogenApiUrl, {
      headers: {
        accept: 'application/json',
        'X-API-Key': API_KEY, // Use the API key from the environment variable
      },
    });

    // 5. Check if the Octogen AI API request was successful.
    if (!response.ok) {
      // Improved error handling: Include the status text from the upstream API.
      return NextResponse.json(
        {
          error: `Octogen AI API error: ${response.status} - ${response.statusText}`,
        },
        {
          status: response.status, // Pass the status code from the other API
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
          },
        }
      );
    }

    // 6. Parse the response from the Octogen AI API.
    const data = await response.json();

    // 7. Return the data to the client.  Important:  Set the correct Content-Type.
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  } catch (error: any) {
    // 8. Handle any errors that occur during the process.
    console.error('Error:', error); // Log the error for debugging.
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  }
}
