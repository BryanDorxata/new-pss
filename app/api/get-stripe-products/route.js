import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

// Handle GET request
export async function GET(req) {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // Fetch products from Stripe
    const products = await stripe.products.list();

    return new Response(JSON.stringify(products), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('Stripe Error:', err);
    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve products',
        details: err.message,
      }),
      { status: 500, headers }
    );
  }
}
