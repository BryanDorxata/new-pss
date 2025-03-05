import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Handle POST requests
export async function POST(req) {
  try {
    const body = await req.json();
    console.log('Received request body:', body);

    const { products, storeId } = body; // products should be an array of objects

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('Products array is required and cannot be empty');
    }

    // Convert products to Stripe's line_items format
    const lineItems = products.map((product) => {
      if (!product.name || !product.unitAmount || !product.quantity) {
        throw new Error('Each product must have a name, unitAmount, and quantity');
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: { name: product.name },
          unit_amount: product.unitAmount,
        },
        quantity: product.quantity,
      };
    });

    const sessionData = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('Origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('Origin')}/cancel`,
      metadata: {
        storeId: storeId || 'unknown',
        orderId: `order_${Math.floor(Math.random() * 100000)}`,
        customerType: 'webflow-user',
      },
    };

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create(sessionData);

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
