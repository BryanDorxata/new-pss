import Stripe from 'stripe';

// Retrieve the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Securely use environment variable

// Common CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins
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
    console.log('Received request body:', body); // Debugging

    // Ensure storeId is received and logged
    console.log('Received storeId:', body.storeId);

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: body.currency || 'usd', // Default to USD
            product_data: {
              name: body.productName || 'Sample Product', // Default product name
            },
            unit_amount: body.unitAmount || 1000, // Default to $10.00 (in cents)
          },
          quantity: body.quantity || 1, // Default quantity
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('Origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('Origin')}/cancel`,
      metadata: {
        storeId: body.storeId ? String(body.storeId) : 'unknown', // Ensure storeId is a string
      },
    });

    console.log('Created session with metadata:', session.metadata); // Debugging

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
