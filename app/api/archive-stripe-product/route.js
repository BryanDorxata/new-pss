import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

export async function POST(req) {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const body = await req.json();
    const { product_id } = body;

    if (!product_id) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required.' }),
        { status: 400, headers }
      );
    }

    const product = await stripe.products.update(product_id, {
      active: false, // Mark the product as inactive (archived)
    });

    return new Response(
      JSON.stringify({ message: 'Product archived successfully.', product }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error archiving product:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to archive product.',
        details: error.message,
      }),
      { status: 500, headers }
    );
  }
}
