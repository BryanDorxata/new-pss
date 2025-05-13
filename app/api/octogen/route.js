import { NextResponse } from 'next/server';

// **Important:**
// 1.  Replace this with your actual Octogen AI API key.
// 2.  DO NOT hardcode your API key directly in your Vercel function code in a production environment.
//     Instead, store it as an environment variable in your Vercel project settings.
//     You can access it in your code using `process.env.OCTOGEN_API_KEY`.
const API_KEY = process.env.OCTOGEN_API_KEY;

export const runtime = 'edge';

export async function GET(): Promise<NextResponse> {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'OCTOGEN_API_KEY is not defined in environment variables.' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': 'https://octogen-c90396.webflow.io',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  }

  return NextResponse.json(
    { apiKey: API_KEY },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://octogen-c90396.webflow.io',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    }
  );
}

export async function OPTIONS(): Promise<NextResponse> {
    return NextResponse.json(
      {},
      {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'https://octogen-c90396.webflow.io',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key', // Add any headers your client might use
        },
      }
    );
}
