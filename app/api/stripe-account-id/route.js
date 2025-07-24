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
    const body = await req.json();
    const { email } = body;

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log('Stripe Connect Account Created:', account.id);

    return new Response(
      JSON.stringify({ accountId: account.id }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to create Stripe Connect account.',
        details: error.message,
      }),
      { status: 500, headers }
    );
  }
}
