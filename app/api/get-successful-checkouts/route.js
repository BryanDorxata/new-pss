import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  // Preflight response for CORS
  return new Response(null, { status: 204, headers });
}

export async function GET(req) {
  try {
    // Return CORS headers for GET request
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // Fetch successful checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 100, // Adjust as needed
      status: 'complete',
    });

    return new Response(JSON.stringify(sessions), { status: 200, headers });
  } catch (error) {
    console.error('Stripe API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch checkout sessions', details: error.message }),
      { status: 500, headers }
    );
  }
}
