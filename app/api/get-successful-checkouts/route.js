import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // Fetch successful checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 100, // Adjust limit as needed (maximum 100 per request)
      status: 'complete', // Only fetch completed sessions
    });

    // Respond with the fetched data
    return new Response(JSON.stringify(sessions), { status: 200, headers });
  } catch (error) {
    console.error('Stripe API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch checkout sessions', details: error.message }),
      { status: 500, headers }
    );
  }
}
