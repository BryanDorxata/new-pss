import Stripe from 'stripe';

// Retrieve the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Securely use environment variable

// Define allowed origins (Add your Webflow and custom domains here)
const allowedOrigins = [
  'https://pss-5215cc.webflow.io',           // Your Webflow staging URL
  'https://pss-5215cc.webflow.io/stripe-testing', // Specific page URL
];

// Common CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Allow any origin temporarily (for testing only)
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
  const { origin } = req.headers;

  // Log the origin for debugging (optional)
  console.log('Request Origin:', origin);

  // Check if the origin is allowed (strict CORS check)
  if (!allowedOrigins.includes(origin)) {
    console.log('CORS Error: Origin not allowed', origin);
    return new Response(
      JSON.stringify({ error: 'CORS error: Origin not allowed' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse the request body
    const body = await req.json();

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
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
    });

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
