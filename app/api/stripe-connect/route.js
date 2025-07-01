// app/api/create-test-account/route.js (or pages/api/create-test-account.js)

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

export async function GET() {
  try {
    // Create a new Express connected account for testing
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Adjust country as needed
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      // You can prefill email or other details if you want
      // email: 'test-user-' + Date.now() + '@example.com',
    });

    return new Response(
      JSON.stringify({ message: 'Test account created successfully!', accountId: account.id }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error creating test account:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create test account.',
        details: error.message,
      }),
      { status: 500, headers }
    );
  }
}
