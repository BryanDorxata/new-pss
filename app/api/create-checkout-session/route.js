import Stripe from 'stripe';

// Retrieve the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Use environment variable for security

// Define allowed origins (add your Webflow domain here)
const allowedOrigins = [
  'https://your-webflow-site.webflow.io', // Replace with your actual Webflow URL
  'https://your-webflow-site.com', // If you have a custom domain
];

// Common CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace '*' with specific domain(s) in production
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

  // Check if the origin is allowed (optional, for stricter CORS)
  if (!allowedOrigins.includes(origin)) {
    return new Response(
      JSON.stringify({ error: 'CORS error: Origin not allowed' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json();

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: body.productName || 'Sample Product', // Use data from the request or default value
            },
            unit_amount: body.unitAmount || 1000, // Use data from the request or default value
          },
          quantity: body.quantity || 1, // Use data from the request or default value
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
