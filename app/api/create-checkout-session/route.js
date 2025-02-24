import Stripe from 'stripe';

// Retrieve the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Common CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Handle POST requests
export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log('Received request body:', body);

    // Ensure storeId and stripeAccount are received
    console.log('Received storeId:', body.storeId);
    console.log('Received stripeAccount:', body.stripeAccount);

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: body.currency || 'usd',
            product_data: {
              name: body.productName || 'Sample Product',
            },
            unit_amount: body.unitAmount || 1000,
          },
          quantity: body.quantity || 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('Origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('Origin')}/cancel`,
      metadata: {
        storeId: body.storeId ? String(body.storeId) : 'unknown',
      },
      on_behalf_of: body.stripeAccount || null, // Pass the connected account ID
      transfer_data: body.stripeAccount
        ? { destination: body.stripeAccount }
        : undefined, // Send funds to the connected account
    });

    console.log('Created session with metadata:', session.metadata);

    // Return the session URL
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
