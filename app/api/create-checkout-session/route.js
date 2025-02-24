import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    const body = await req.json();
    console.log('Received request body:', body);

    const { productName, unitAmount, quantity, storeId, stripeAccount } = body;

    if (!stripeAccount) {
      throw new Error('Missing stripeAccount');
    }

    // Create Stripe Checkout session with metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: productName || 'Sample Product' },
            unit_amount: unitAmount || 1000,
          },
          quantity: quantity || 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('Origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('Origin')}/cancel`,
      metadata: {
        storeId: storeId || 'unknown',
        orderId: `order_${Math.floor(Math.random() * 100000)}`,
        customerType: 'webflow-user', // Dummy metadata for testing
      },
      on_behalf_of: stripeAccount, // Use connected account
      transfer_data: {
        destination: stripeAccount, // Send payment to the connected account
      },
    });

    console.log('Created session:', session);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
