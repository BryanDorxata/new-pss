import Stripe from 'stripe';

// Retrieve the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Use environment variable for security

// Define allowed origins (add your Webflow domain here)
const allowedOrigins = [
  'https://your-webflow-site.webflow.io',  // Replace with your actual Webflow URL
  'https://your-webflow-site.com'  // If you have a custom domain
];

export async function POST(req) {
  const { origin } = req.headers;

  // Check if the origin is allowed
  if (!allowedOrigins.includes(origin)) {
    return new Response(
      JSON.stringify({ error: 'CORS error' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sample Product',
            },
            unit_amount: 1000, // 10.00 USD
          },
          quantity: 1,
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
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
